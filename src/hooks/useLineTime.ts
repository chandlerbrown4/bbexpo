import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useReputation } from '../context/ReputationContext';

export interface LineTimePost {
  id: string;
  bar_id: string;
  user_name: string;
  line: string;
  minutes: number;
  timestamp: string;
  verified: boolean;
  weight: number;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
}

export const useLineTime = (barId?: string) => {
  const { user } = useAuth();
  const { profile, reputation, barReports } = useReputation();
  const [lineTimes, setLineTimes] = useState<LineTimePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateWeight = (userReputation: typeof reputation | null, barReport: typeof barReports[0] | undefined): number => {
    let weight = 1.0; // Base weight

    if (userReputation) {
      // Reputation points multiplier (0.5x to 2.0x)
      const reputationMultiplier = Math.min(2.0, Math.max(0.5, 
        (userReputation.reputation_points || 0) / 1000 + 0.5));
      weight *= reputationMultiplier;

      // Accuracy rate multiplier (0.5x to 1.5x)
      if (userReputation.total_votes > 0) {
        const accuracyRate = userReputation.positive_votes_received / userReputation.total_votes;
        const accuracyMultiplier = Math.min(1.5, Math.max(0.5, accuracyRate + 0.5));
        weight *= accuracyMultiplier;
      }

      // Bar-specific expertise multiplier (1.0x to 2.0x)
      if (barReport) {
        const expertiseMultiplier = Math.min(2.0, Math.max(1.0, 
          (barReport.accuracy_rate || 0) * 2));
        weight *= expertiseMultiplier;
      }
    }

    return Number(weight.toFixed(2));
  };

  const fetchLineTimes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('line_time_posts')
        .select(`
          *,
          votes:line_time_votes(vote_type)
        `);

      if (barId) {
        query = query.eq('bar_id', barId);
      }

      // Only fetch line times from the last 2 hours
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      query = query.gte('timestamp', twoHoursAgo.toISOString());

      const { data, error: fetchError } = await query
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      // Process the line times with vote information
      const processedLineTimes = (data || []).map(post => {
        const votes = post.votes || [];
        const userVote = votes.find(v => v.user_id === user?.id)?.vote_type;
        const upvotes = votes.filter(v => v.vote_type === 'up').length;
        const downvotes = votes.filter(v => v.vote_type === 'down').length;

        delete post.votes;
        return {
          ...post,
          upvotes,
          downvotes,
          user_vote: userVote,
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

  const addLineTime = async (barId: string, line: string, minutes: number) => {
    try {
      if (!user || !profile) {
        throw new Error('Must be logged in to post line times');
      }

      const barReport = barReports.find(report => report.bar_id === barId);
      
      // Check cooldown period (5 minutes)
      if (barReport) {
        const lastReportTime = new Date(barReport.last_report_at).getTime();
        const cooldownPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (Date.now() - lastReportTime < cooldownPeriod) {
          throw new Error('Please wait before submitting another line time');
        }
      }

      const weight = calculateWeight(reputation, barReport);

      const { error: insertError } = await supabase
        .from('line_time_posts')
        .insert([{
          user_id: user.id,
          bar_id: barId,
          line,
          minutes,
          timestamp: new Date().toISOString(),
          verified: false,
          weight
        }]);

      if (insertError) throw insertError;

      await fetchLineTimes();
    } catch (err: any) {
      console.error('Error adding line time:', err);
      setError(err.message);
      throw err;
    }
  };

  // Fetch line times on mount and when barId changes
  useEffect(() => {
    fetchLineTimes();
  }, [barId]);

  return {
    lineTimes,
    loading,
    error,
    addLineTime,
    refreshLineTimes: fetchLineTimes
  };
};
