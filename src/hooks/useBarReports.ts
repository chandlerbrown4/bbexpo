import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

export interface BarReport {
  report_id: string;
  wait_minutes: number;
  capacity_percentage: number;
  crowd_density: 'light' | 'moderate' | 'packed';
  reporter_name: string;
  reporter_expertise_level: number;
  upvotes: number;  
  downvotes: number;  
  user_vote?: number;
  created_at: string;
}

interface UseBarReportsReturn {
  reports: BarReport[];
  loading: boolean;
  error: string | null;
  refreshReports: () => Promise<void>;
  upvoteReport: (reportId: string) => Promise<void>;
  downvoteReport: (reportId: string) => Promise<void>;
}

export const useBarReports = (barId: string): UseBarReportsReturn => {
  const [reports, setReports] = useState<BarReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'get_bar_line_reports',
        {
          p_bar_id: barId,
          p_limit: 50
        }
      );

      if (rpcError) throw rpcError;
      
      // Convert bigint to number for upvotes and downvotes
      const processedData = (data?.map(report => ({
        ...report,
        upvotes: Number(report.upvotes),
        downvotes: Number(report.downvotes)
      })) || []).sort((a, b) => {
        // Convert both timestamps to UTC for comparison
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      
      setReports(processedData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reportId: string, isUpvote: boolean) => {
    try {
      const { error } = await supabase.rpc(
        'vote_on_line_report',
        {
          p_line_report_id: reportId,
          p_vote_type: isUpvote ? 1 : -1
        }
      );

      if (error) throw error;

      // Refresh reports to get updated vote counts
      await fetchReports();
    } catch (err) {
      console.error(`Error ${isUpvote ? 'upvoting' : 'downvoting'} report:`, err);
      throw err;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [barId]);

  return {
    reports,
    loading,
    error,
    refreshReports: fetchReports,
    upvoteReport: (reportId: string) => handleVote(reportId, true),
    downvoteReport: (reportId: string) => handleVote(reportId, false)
  };
};
