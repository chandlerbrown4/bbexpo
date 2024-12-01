export interface UserReputation {
  id: string;
  user_id: string;
  reputation_points: number;
  total_reports: number;
  accurate_reports: number;
  total_votes_received: number;
  positive_votes_received: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  required_score: number;
  badge_type: 'accuracy' | 'speed' | 'consistency' | 'community' | 'special';
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface BarExpertise {
  id: string;
  user_id: string;
  bar_id: string;
  reports_count: number;
  accuracy_rate: number;
  expert_status: 'regular' | 'trusted' | 'expert';
  last_report_at: string;
}

export interface LineTimeVote {
  id: string;
  line_time_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface EnhancedProfile {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  preferred_bars?: string[];
  date_of_birth: string;
  reputation_points: number;
  total_reports: number;
  accurate_reports: number;
  badge_count: number;
  badges: string[];
  created_at: string;
  updated_at: string;
}
