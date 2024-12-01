import { formatDistanceToNow } from 'date-fns';

export interface RecentLineTime {
  id: uuid;
  bar_id: uuid;
  line: string;
  minutes: number;
  timestamp: string;
  user_id: uuid;
  verified: boolean;
  weight: number;
  upvotes: number;
  downvotes: number;
  reporter_name: string;
  reporter_reputation: number;
  reporter_status: 'regular' | 'trusted' | 'expert';
}

export const LINE_CATEGORIES = {
  NO_LINE: { min: 0, max: 0, label: 'No Line' },
  SHORT: { min: 1, max: 4, label: 'Short Line' },
  MEDIUM: { min: 5, max: 15, label: 'Medium Line' },
  LONG: { min: 16, max: 30, label: 'Long Line' },
  VERY_LONG: { min: 31, max: Infinity, label: 'Very Long Line' },
} as const;

export const EXPERT_STATUS_EMOJI = {
  regular: '👤',
  trusted: '⭐',
  expert: '👑',
} as const;

const TIME_DECAY_FACTOR = 0.8; 
const VOTE_IMPACT_FACTOR = 0.2; 
const MAX_REPORT_AGE_HOURS = 4; 

export function calculateLineTimeWeight(report: RecentLineTime): number {
  const reportAge = new Date().getTime() - new Date(report.timestamp).getTime();
  const ageInHours = reportAge / (1000 * 60 * 60);
  
  if (ageInHours > MAX_REPORT_AGE_HOURS) return 0;
  
  const timeWeight = Math.pow(TIME_DECAY_FACTOR, ageInHours);
  
  const totalVotes = report.upvotes + report.downvotes;
  const voteRatio = totalVotes > 0 ? report.upvotes / totalVotes : 0.5;
  const voteWeight = 1 + (voteRatio - 0.5) * VOTE_IMPACT_FACTOR;
  
  return report.weight * timeWeight * voteWeight;
}

export function estimateWaitTime(reports: RecentLineTime[]): { minutes: number; category: string } {
  if (!reports.length) return { minutes: 0, category: LINE_CATEGORIES.NO_LINE.label };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  reports.forEach(report => {
    const weight = calculateLineTimeWeight(report);
    totalWeight += weight;
    weightedSum += report.minutes * weight;
  });
  
  if (totalWeight === 0) return { minutes: 0, category: LINE_CATEGORIES.NO_LINE.label };
  
  const estimatedMinutes = Math.round(weightedSum / totalWeight);
  
  let category = LINE_CATEGORIES.NO_LINE.label;
  if (estimatedMinutes > 30) category = LINE_CATEGORIES.VERY_LONG.label;
  else if (estimatedMinutes > 15) category = LINE_CATEGORIES.LONG.label;
  else if (estimatedMinutes > 4) category = LINE_CATEGORIES.MEDIUM.label;
  else if (estimatedMinutes > 0) category = LINE_CATEGORIES.SHORT.label;
  
  return { minutes: estimatedMinutes, category };
}

export function formatReportTime(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function formatLineTimeReport(report: RecentLineTime): string {
  const emoji = EXPERT_STATUS_EMOJI[report.reporter_status];
  const timeAgo = formatReportTime(report.timestamp);
  return `${emoji} ${report.reporter_name} reported ${report.minutes} minutes ${timeAgo}`;
}
