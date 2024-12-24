export interface LineTimeReport {
  id: string;
  bar_id: string;
  user_id: string;
  wait_time: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  upvotes: number;
  downvotes: number;
}

export interface RecentLineTime {
  id: string;
  bar_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_status: 'regular' | 'trusted' | 'expert';
  minutes: number;
  crowd_density: 'light' | 'moderate' | 'packed';
  capacity_percentage: number;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down';
  report_reliability_score: number;
  reporter_accuracy: number;
  reporter_bar_level: number;
  reporter_total_reports: number;
}

export type LineTimeCategory = 'No Line' | 'Short Line' | 'Medium Line' | 'Long Line' | 'Very Long Line';

export interface LineTimeEstimate {
  minutes: number;
  category: LineTimeCategory;
  confidence: number;
}
