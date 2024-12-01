/**
 * Line Time Calculation System
 * 
 * This module implements a sophisticated wait time estimation system that considers
 * multiple factors including time decay, vote ratios, and reporter reputation.
 * 
 * Core Equation:
 * EstimatedMinutes = round(
 *   Σ(minutes[i] * weight[i] * 0.8^ageInHours[i] * (1 + (upvotes[i]/(upvotes[i]+downvotes[i]) - 0.5) * 0.2))
 *   ────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   Σ(weight[i] * 0.8^ageInHours[i] * (1 + (upvotes[i]/(upvotes[i]+downvotes[i]) - 0.5) * 0.2))
 * )
 * 
 * Variables:
 * - minutes[i]: Reported wait time in minutes for report i
 * - weight[i]: Base weight of report i (derived from reporter reputation)
 * - ageInHours[i]: Age of report i in hours
 * - upvotes[i]: Number of upvotes for report i
 * - downvotes[i]: Number of downvotes for report i
 * 
 * Constants:
 * - TIME_DECAY_FACTOR (0.8): Weight decreases by 20% per hour
 * - VOTE_WEIGHT_FACTOR (0.2): Maximum vote influence on weight (±10%)
 * - MAX_REPORT_AGE_HOURS (2): Reports older than this are ignored
 * 
 * Categories:
 * - No Line: 0 minutes
 * - Short Line: 1-4 minutes
 * - Medium Line: 5-15 minutes
 * - Long Line: 16-30 minutes
 * - Very Long Line: 31+ minutes
 */

import { RecentLineTime } from '../hooks/useRecentLineTimes';

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

const MAX_REPORT_AGE_HOURS = 2;
const TIME_DECAY_FACTOR = 0.8;
const VOTE_WEIGHT_FACTOR = 0.2;

export function calculateEstimatedWaitTime(reports: RecentLineTime[]): { 
  minutes: number; 
  category: string;
} {
  if (!reports.length) {
    return { minutes: 0, category: LINE_CATEGORIES.NO_LINE.label };
  }

  let totalWeight = 0;
  let weightedSum = 0;

  reports.forEach(report => {
    const ageInHours = (Date.now() - new Date(report.timestamp).getTime()) / (1000 * 60 * 60);
    if (ageInHours > MAX_REPORT_AGE_HOURS) return;

    let weight = report.weight * Math.pow(TIME_DECAY_FACTOR, ageInHours);

    const totalVotes = report.upvotes + report.downvotes;
    if (totalVotes > 0) {
      const voteRatio = report.upvotes / totalVotes;
      weight *= (1 + (voteRatio - 0.5) * VOTE_WEIGHT_FACTOR);
    }

    totalWeight += weight;
    weightedSum += report.minutes * weight;
  });

  if (totalWeight === 0) {
    return { minutes: 0, category: LINE_CATEGORIES.NO_LINE.label };
  }

  const estimatedMinutes = Math.round(weightedSum / totalWeight);

  let category = LINE_CATEGORIES.NO_LINE.label;
  if (estimatedMinutes >= 31) category = LINE_CATEGORIES.VERY_LONG.label;
  else if (estimatedMinutes >= 16) category = LINE_CATEGORIES.LONG.label;
  else if (estimatedMinutes >= 5) category = LINE_CATEGORIES.MEDIUM.label;
  else if (estimatedMinutes >= 1) category = LINE_CATEGORIES.SHORT.label;

  return { minutes: estimatedMinutes, category };
}

export function formatTimeAgo(timestamp: string): string {
  const now = new Date().getTime();
  const reportTime = new Date(timestamp).getTime();
  const diffInMinutes = Math.floor((now - reportTime) / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes === 1) return '1 minute ago';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
}

export function formatLineTimeReport(report: RecentLineTime): string {
  const emoji = EXPERT_STATUS_EMOJI[report.reporter_status];
  const timeAgo = formatTimeAgo(report.timestamp);
  return `${emoji} ${report.reporter_name} reported ${report.minutes} minutes ${timeAgo}`;
}
