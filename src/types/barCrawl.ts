import { Database } from './supabase';

export type BarCrawl = Database['public']['Tables']['bar_crawls']['Row'];
export type BarCrawlStop = Database['public']['Tables']['bar_crawl_stops']['Row'] & {
  bars: Database['public']['Tables']['bars']['Row'];
};
export type BarCrawlParticipant = Database['public']['Tables']['bar_crawl_participants']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export type BarCrawlStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type ParticipantStatus = 'joined' | 'pending' | 'declined';

export interface CreateBarCrawlData {
  name: string;
  description: string;
  start_date: Date;
  is_private: boolean;
  invite_code?: string;
  stops: {
    bar_id: string;
    bar_name: string;
    order_index: number;
    planned_start_time: Date;
    planned_end_time: Date;
    travel_time_to_next?: number;
  }[];
}

export interface BarCrawlWithRelations extends BarCrawl {
  stops: (BarCrawlStop & {
    bars: Database['public']['Tables']['bars']['Row'];
  })[];
  participants: (BarCrawlParticipant & {
    profiles: Database['public']['Tables']['profiles']['Row'];
  })[];
  host: Database['public']['Tables']['profiles']['Row'];
}
