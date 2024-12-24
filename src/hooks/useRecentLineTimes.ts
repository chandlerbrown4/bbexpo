import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

export interface RecentLineTime {
  id: string;
  bar_id: string;
  bar_name: string;
  minutes: number;
  capacity_percentage: number;
  crowd_density: string;
  cover_charge: number;
  created_at: string;
  reporter_id: string;
  reporter_name: string;
  reporter_status: 'regular' | 'trusted' | 'expert';
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
  reporter_accuracy: number;
  reporter_bar_level: number;
  reporter_total_reports: number;
  report_reliability_score: number;
  distance_miles: number;
}

export const useRecentLineTimes = (barId?: string) => {
  const [recentLineTimes, setRecentLineTimes] = useState<RecentLineTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { location } = useLocation();

  const fetchRecentLineTimes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Location in useRecentLineTimes:', location);
      console.log('User in useRecentLineTimes:', user?.id);

      if (!user || !location) {
        console.log('Missing user or location data');
        setRecentLineTimes([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase.rpc('get_recent_line_reports', {
        p_user_id: user.id,
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_max_age_minutes: 120, // 2 hours
        p_max_distance_miles: 20
      });

      console.log('get_recent_line_reports response:', { data, error: fetchError });

      if (fetchError) throw fetchError;

      // Transform the data to match our interface
      const transformedData: RecentLineTime[] = data.map((report: any) => ({
        id: report.report_id,
        bar_id: report.bar_id,
        bar_name: report.bar_name,
        minutes: report.wait_minutes,
        capacity_percentage: report.capacity_percentage,
        crowd_density: report.crowd_density,
        cover_charge: report.cover_charge,
        created_at: report.created_at,
        reporter_id: report.reporter_id,
        reporter_name: report.reporter_name,
        reporter_status: report.reporter_status,
        upvotes: report.upvotes,
        downvotes: report.downvotes,
        user_vote: report.user_vote === '1' ? 'up' : report.user_vote === '-1' ? 'down' : null,
        reporter_accuracy: report.reporter_accuracy,
        reporter_bar_level: report.reporter_bar_level,
        reporter_total_reports: report.reporter_total_reports,
        report_reliability_score: report.report_reliability_score,
        distance_miles: report.distance_miles
      }));

      console.log('Transformed line times data:', transformedData);

      // Filter by barId if provided
      const filteredData = barId 
        ? transformedData.filter(report => report.bar_id === barId)
        : transformedData;

      setRecentLineTimes(filteredData);
    } catch (e) {
      console.error('Error fetching recent line times:', e);
      setError('Failed to fetch recent line times');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentLineTimes();
  }, [user, location, barId]);

  return {
    recentLineTimes,
    loading,
    error,
    refreshLineTimes: fetchRecentLineTimes
  };
};
