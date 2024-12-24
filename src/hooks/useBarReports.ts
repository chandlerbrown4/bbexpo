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
  upvotes: number;  // Cast from bigint in fetchReports
  downvotes: number;  // Cast from bigint in fetchReports
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
      const { data, error } = await supabase.rpc(
        'vote_on_line_report',
        {
          report_id: reportId,
          vote_type: isUpvote ? 1 : -1
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      // Update local state
      setReports(prevReports =>
        prevReports.map(report => {
          if (report.report_id === reportId) {
            return {
              ...report,
              upvotes: isUpvote ? report.upvotes + 1 : report.upvotes,
              downvotes: !isUpvote ? report.downvotes + 1 : report.downvotes,
              user_vote: isUpvote ? 1 : -1
            };
          }
          return report;
        })
      );
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
