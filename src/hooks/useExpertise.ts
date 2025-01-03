import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export interface ExpertiseLevel {
  bar_id: string;
  bar_name: string;
  level: number;
  total_reports: number;
  accuracy_rate: number;
  last_report_at: string;
}

export const useExpertise = () => {
  const { user } = useAuth();
  const [expertiseLevels, setExpertiseLevels] = useState<ExpertiseLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpertise = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: rpcError } = await supabase
        .rpc('get_user_expertise', {
          p_user_id: user.id
        });

      if (rpcError) throw rpcError;

      setExpertiseLevels(data || []);
    } catch (err) {
      console.error('Error fetching expertise:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expertise levels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpertise();
  }, [user]);

  return {
    expertiseLevels,
    loading,
    error,
    refreshExpertise: fetchExpertise
  };
};
