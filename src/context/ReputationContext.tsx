import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  preferred_bar: string | null;
}

interface UserReputation {
  id: string;
  user_id: string;
  reputation_points: number;
  total_reports: number;
  total_votes: number;
  positive_votes_received: number;
}

interface BarReport {
  id: string;
  user_id: string;
  bar_id: string;
  reports_count: number;
  accuracy_rate: number;
  status: string;
  last_report_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  required_score: number;
  badge_type: string;
}

interface ReputationContextType {
  profile: UserProfile | null;
  reputation: UserReputation | null;
  badges: Badge[];
  barReports: BarReport[];
  loading: boolean;
  error: string | null;
  voteOnLineTime: (lineTimeId: string, voteType: 'up' | 'down') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ReputationContext = createContext<ReputationContextType | undefined>(undefined);

export const ReputationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [barReports, setBarReports] = useState<BarReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      if (!user) {
        setProfile(null);
        setReputation(null);
        setBadges([]);
        setBarReports([]);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      setProfile(profileData);

      // Fetch user reputation
      const { data: reputationData, error: reputationError } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (reputationError && reputationError.code !== 'PGRST116') {
        throw reputationError;
      }
      setReputation(reputationData);

      // Fetch badges
      const { data: badgeData, error: badgeError } = await supabase
        .from('badges')
        .select('*');

      if (badgeError) {
        console.error('Error fetching badges:', badgeError);
      }
      setBadges(badgeData || []);

      // Fetch bar reports
      //const { data: reportData, error: reportError } = await supabase
      //  .from('bar_reports')
      //  .select('*')
      //  .eq('user_id', user.id);

      //if (reportError) {
      //  console.error('Error fetching bar reports:', reportError);
      //}
      //setBarReports(reportData || []);

    } catch (err: any) {
      console.error('Error fetching reputation data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const voteOnLineTime = async (lineTimeId: string, voteType: 'up' | 'down') => {
    try {
      if (!user) throw new Error('Must be logged in to vote');

      // Check if user has already voted on this line time
      const { data: existingVote } = await supabase
        .from('line_time_votes')
        .select('*')
        .eq('line_time_id', lineTimeId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        throw new Error('You have already voted on this line time');
      }

      // Get the user_id of the line time post creator
      const { data: lineTime } = await supabase
        .from('line_time_posts')
        .select('user_id')
        .eq('id', lineTimeId)
        .single();

      if (!lineTime) throw new Error('Line time not found');

      // Start a transaction by using RPC
      const { data, error } = await supabase.rpc('handle_line_time_vote', {
        p_line_time_id: lineTimeId,
        p_user_id: user.id,
        p_vote_type: voteType,
        p_reporter_id: lineTime.user_id
      });

      if (error) throw error;

      // Refresh the profile data to get updated reputation
      await fetchProfile();
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  };

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [user]);

  return (
    <ReputationContext.Provider 
      value={{
        profile,
        reputation,
        badges,
        barReports,
        loading,
        error,
        voteOnLineTime,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </ReputationContext.Provider>
  );
};

export const useReputation = () => {
  const context = useContext(ReputationContext);
  if (context === undefined) {
    throw new Error('useReputation must be used within a ReputationProvider');
  }
  return context;
};
