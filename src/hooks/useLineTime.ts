import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useReputation } from '../context/ReputationContext';
import { Alert } from 'react-native';

export interface LineTimePost {
  id: string;
  bar_id: string;
  user_name: string;
  wait_minutes: number;
  capacity_percentage: number;
  crowd_density: string;
  cover_charge: number | null;
  timestamp: string;
  verified: boolean;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
}

interface SubmissionCheck {
  can_submit: boolean;
  cooldown_seconds: number;
  reason: string;
}

interface SubmissionResult {
  report_id: string;
  points_earned: number;
  new_bar_level: number;
  achievement_unlocked: string | null;
}

export const useLineTime = (barId?: string) => {
  const { user } = useAuth();
  const { profile, reputation, barReports, refreshProfile } = useReputation();
  const [lineTimes, setLineTimes] = useState<LineTimePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateWeight = (userReputation: typeof reputation | null, barReport: typeof barReports[0] | undefined): number => {
    let weight = 1.0;

    if (userReputation) {
      const reputationMultiplier = Math.min(2.0, Math.max(0.5, 
        (userReputation.reputation_points || 0) / 1000 + 0.5));
      weight *= reputationMultiplier;

      if (userReputation.total_votes > 0) {
        const accuracyRate = userReputation.positive_votes_received / userReputation.total_votes;
        const accuracyMultiplier = Math.min(1.5, Math.max(0.5, accuracyRate + 0.5));
        weight *= accuracyMultiplier;
      }

      if (barReport) {
        const expertiseMultiplier = Math.min(2.0, Math.max(1.0, 
          (barReport.accuracy_rate || 0) * 2));
        weight *= expertiseMultiplier;
      }
    }

    return Number(weight.toFixed(2));
  };

  const toNumericVote = (vote: 'up' | 'down'): number => vote === 'up' ? 1 : -1;
  const toStringVote = (vote: number): 'up' | 'down' | undefined => {
    if (vote === 1) return 'up';
    if (vote === -1) return 'down';
    return undefined;
  };

  const addLineTime = async (
    barId: string, 
    waitMinutes: number,
    capacityPercentage: number,
    crowdDensity: string,
    coverCharge?: number
  ) => {
    try {
      if (!user?.id) {
        throw new Error('Must be logged in to post line times');
      }

      const { data, error: submitError } = await supabase
        .rpc('add_line_report', {
          p_user_id: user.id,
          p_bar_id: barId,
          p_wait_minutes: waitMinutes,
          p_capacity_percentage: capacityPercentage,
          p_crowd_density: crowdDensity,
          p_cover_charge: coverCharge || null
        });

      if (submitError) throw submitError;

      const result = data as SubmissionResult;

      if (result.achievement_unlocked) {
        Alert.alert(
          '🏆 Achievement Unlocked!',
          `You've earned the ${result.achievement_unlocked} achievement and ${result.points_earned} points!`
        );
      } else if (result.points_earned > 0) {
        Alert.alert(
          '🎉 Points Earned!',
          `You've earned ${result.points_earned} points for your report!`
        );
      }

      await refreshProfile();

      return result;
    } catch (err: any) {
      console.error('Error adding line time:', err);
      setError(err.message);
      throw err;
    }
  };

  const voteOnLineTime = async (lineTimeId: string, voteType: 'up' | 'down') => {
    try {
      if (!user?.id) {
        throw new Error('Must be logged in to vote');
      }

      const { data, error: voteError } = await supabase
        .from('line_report_votes')
        .upsert(
          {
            line_report_id: lineTimeId,
            user_id: user.id,
            vote_type: toNumericVote(voteType)
          },
          {
            onConflict: 'line_report_id,user_id'
          }
        );

      if (voteError) throw voteError;

      await fetchLineTimes();
      
      return data;
    } catch (err: any) {
      console.error('Error voting on line time:', err);
      setError(err.message);
      throw err;
    }
  };

  const fetchLineTimes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('line_reports')
        .select(`
          *,
          votes:line_report_votes(
            vote_type,
            user_id
          )
        `);

      if (barId) {
        query = query.eq('bar_id', barId);
      }

      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      query = query.gte('created_at', twoHoursAgo.toISOString());

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const processedLineTimes = (data || []).map(post => {
        const votes = post.votes || [];
        const userVote = toStringVote(votes.find(v => v.user_id === user?.id)?.vote_type);
        const upvotes = votes.filter(v => v.vote_type === 1).length;
        const downvotes = votes.filter(v => v.vote_type === -1).length;

        const { votes: _, ...postWithoutVotes } = post;
        
        return {
          ...postWithoutVotes,
          upvotes,
          downvotes,
          user_vote: userVote
        };
      });

      setLineTimes(processedLineTimes);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching line times:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineTimes();
  }, [barId]);

  return {
    lineTimes,
    loading,
    error,
    addLineTime,
    voteOnLineTime,
    refreshLineTimes: fetchLineTimes,
  };
};
