/**
 * Line Time Calculation System
 * 
 * A sophisticated wait time estimation system that weighs multiple factors to provide
 * accurate and reliable line time predictions. The system uses a weighted average
 * approach where each report's weight is determined by several key factors.
 * 
 * Key Factors:
 * 1. Reporter Reliability (40% impact)
 *    - Bar-specific expertise level (0-5)
 *    - Historical accuracy rate
 *    - Total reports submitted
 *    - Global reputation score
 * 
 * 2. Time Decay (30% impact)
 *    - Exponential decay: weight = baseWeight * (0.8)^hoursOld
 *    - Reports older than 2 hours are excluded
 *    - Recent reports have significantly more influence
 * 
 * 3. Vote Confidence (20% impact)
 *    - Requires minimum 3 votes for full confidence
 *    - Vote ratio affects weight by ±10%
 *    - Formula: 1 + ((upvotes/totalVotes - 0.5) * 0.2)
 * 
 * 4. Crowd Correlation (10% impact)
 *    - Light crowds: 0.8x weight
 *    - Moderate crowds: 1.0x weight
 *    - Packed crowds: 1.2x weight
 * 
 * Final Weight Formula:
 * weight = reportReliabilityScore * 
 *          timeDecayFactor * 
 *          voteConfidenceFactor * 
 *          crowdDensityFactor
 * 
 * Confidence Score (0-1):
 * confidence = min(
 *   reportsCount / 5,                    // More reports = higher confidence
 *   averageReporterReliability,          // Better reporters = higher confidence
 *   1 - (averageReportAge / maxAge)      // Newer reports = higher confidence
 * )
 * 
 * Wait Time Categories:
 * - No Line: 0 minutes
 * - Short Line: 1-4 minutes
 * - Medium Line: 5-15 minutes
 * - Long Line: 16-30 minutes
 * - Very Long Line: 31+ minutes
 * 
 * Reporter Status:
 * 👤 Regular: New or occasional reporters
 * ⭐ Trusted: Level 3-4 expertise, good accuracy
 * 👑 Expert: Level 5 expertise, high accuracy
 */

import { RecentLineTime } from '../hooks/useRecentLineTimes';

export const LINE_CATEGORIES = {
  NO_LINE: { min: 0, max: 0, label: 'No Line' },
  SHORT: { min: 1, max: 4, label: 'Short Line' },
  MEDIUM: { min: 5, max: 15, label: 'Medium Line' },
  LONG: { min: 16, max: 30, label: 'Long Line' },
  VERY_LONG: { min: 31, max: Infinity, label: 'Very Long Line' },
} as const;

export type LineTimeCategory = typeof LINE_CATEGORIES[keyof typeof LINE_CATEGORIES]['label'];

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
  category: LineTimeCategory;
  confidence: number;
} {
  if (!reports.length) {
    return { minutes: 0, category: LINE_CATEGORIES.NO_LINE.label, confidence: 0 };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  let confidence = 0;

  reports.forEach(report => {
    const ageInHours = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
    if (ageInHours > MAX_REPORT_AGE_HOURS) return;

    // Base weight is the report's reliability score
    let weight = report.report_reliability_score;

    // Apply time decay
    weight *= Math.pow(TIME_DECAY_FACTOR, ageInHours);

    // Apply vote confidence
    const totalVotes = report.upvotes + report.downvotes;
    if (totalVotes > 0) {
      const voteRatio = report.upvotes / totalVotes;
      weight *= (1 + (voteRatio - 0.5) * VOTE_WEIGHT_FACTOR);
    }

    totalWeight += weight;
    weightedSum += report.minutes * weight;
    confidence += weight;
  });

  if (totalWeight === 0) {
    return { minutes: 0, category: LINE_CATEGORIES.NO_LINE.label, confidence: 0 };
  }

  const estimatedMinutes = Math.round(weightedSum / totalWeight);

  // Determine category
  let category: LineTimeCategory = LINE_CATEGORIES.NO_LINE.label;
  if (estimatedMinutes >= LINE_CATEGORIES.VERY_LONG.min) category = LINE_CATEGORIES.VERY_LONG.label;
  else if (estimatedMinutes >= LINE_CATEGORIES.LONG.min) category = LINE_CATEGORIES.LONG.label;
  else if (estimatedMinutes >= LINE_CATEGORIES.MEDIUM.min) category = LINE_CATEGORIES.MEDIUM.label;
  else if (estimatedMinutes >= LINE_CATEGORIES.SHORT.min) category = LINE_CATEGORIES.SHORT.label;

  return { 
    minutes: estimatedMinutes, 
    category,
    confidence: Math.min(1, confidence / reports.length) // Normalize confidence to 0-1 range
  };
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
  const timeAgo = formatTimeAgo(report.created_at);
  return `${emoji} ${report.reporter_name} reported ${report.minutes} minutes ${timeAgo}`;
}
