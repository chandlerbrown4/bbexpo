import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  UserReputation, 
  Badge, 
  UserBadge, 
  BarExpertise, 
  EnhancedProfile 
} from '../types/reputation';

interface UseReputationResult {
  profile: EnhancedProfile | null;
  badges: Badge[];
  barExpertise: BarExpertise[];
  loading: boolean;
  error: string | null;
  voteOnLineTime: (lineTimeId: string, voteType: 'up' | 'down') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useReputation = (): UseReputationResult => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EnhancedProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [barExpertise, setBarExpertise] = useState<BarExpertise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      if (!user) return;

      const { data, error: profileError } = await supabase
        .from('enhanced_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(data);

      const { data: badgeData, error: badgeError } = await supabase
        .from('badges')
        .select('*');

      if (badgeError) throw badgeError;
      setBadges(badgeData);

      const { data: expertiseData, error: expertiseError } = await supabase
        .from('bar_expertise')
        .select('*')
        .eq('user_id', user.id);

      if (expertiseError) throw expertiseError;
      setBarExpertise(expertiseData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const voteOnLineTime = async (lineTimeId: string, voteType: 'up' | 'down') => {
    try {
      if (!user) throw new Error('Must be logged in to vote');

      const { data: existingVote } = await supabase
        .from('line_time_votes')
        .select('*')
        .eq('line_time_id', lineTimeId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          await supabase
            .from('line_time_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          await supabase
            .from('line_time_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        await supabase
          .from('line_time_votes')
          .insert({
            line_time_id: lineTimeId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return {
    profile,
    badges,
    barExpertise,
    loading,
    error,
    voteOnLineTime,
    refreshProfile: fetchProfile
  };
};
