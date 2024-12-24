import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface UserProfile {
  id: string;
  display_name: string;
}

interface BarExpertise {
  bar_id: string;
  bar_name: string;
  expertise_level: number;
  total_reports: number;
  accuracy_rate: number;
  last_report_at: string;  // timestamp without timezone
}

interface ReputationContextType {
  profile: UserProfile | null;
  barExpertise: BarExpertise[];
  loading: boolean;
  error: string | null;
  voteOnLineTime: (lineTimeId: string, voteType: 'up' | 'down') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ReputationContext = createContext<ReputationContextType | undefined>(undefined);

export const ReputationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barExpertise, setBarExpertise] = useState<BarExpertise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      if (!user) {
        setProfile(null);
        setBarExpertise([]);
        return;
      }

      // Get basic profile info
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // If the user doesn't exist yet, that's okay - we'll just set profile to null
        if (profileError.code === 'PGRST116') {
          setProfile(null);
        } else {
          throw profileError;
        }
      } else {
        setProfile(profileData);
      }

      // Get user expertise summary
      const { data: expertiseData, error: expertiseError } = await supabase
        .rpc('get_user_expertise_summary', {
          p_user_id: user.id
        });

      if (expertiseError) throw expertiseError;
      setBarExpertise(expertiseData || []);

    } catch (err) {
      console.error('Error fetching reputation data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const voteOnLineTime = async (lineTimeId: string, voteType: 'up' | 'down') => {
    try {
      if (!user) throw new Error('Must be logged in to vote');

      const { error } = await supabase.rpc('vote_on_line_report', {
        p_report_id: lineTimeId,
        p_vote_type: voteType === 'up' ? 1 : -1
      });

      if (error) throw error;
      await fetchProfile();
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return (
    <ReputationContext.Provider 
      value={{
        profile,
        barExpertise,
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
