/**
 * Confidence score result type
 */
export type ConfidenceScoreResult = {
  score: number; // 0-100
  rating: 'low' | 'medium' | 'high';
  reason: string;
};

/**
 * Calculates a confidence score for a valuation based on comps, recency, and HPI volatility.
 * @param numComps Number of comparable sales
 * @param avgCompRecency Months since most recent comp
 * @param hpiVolatility Standard deviation of YoY HPI growth (as decimal, e.g. 0.05 for 5%)
 * @returns ConfidenceScoreResult
 */
export function scoreConfidence(
  numComps: number,
  avgCompRecency: number,
  hpiVolatility: number
): ConfidenceScoreResult {
  // Heuristic scoring
  let score = 50;
  let reason = [];

  // More comps = higher confidence
  if (numComps >= 5) {
    score += 20;
    reason.push('Plenty of comparable sales.');
  } else if (numComps >= 3) {
    score += 10;
    reason.push('Some comparable sales.');
  } else if (numComps === 2) {
    score += 5;
    reason.push('Few comparable sales.');
  } else {
    score -= 10;
    reason.push('Very few comparable sales.');
  }

  // Recency: more recent = higher confidence
  if (avgCompRecency <= 3) {
    score += 15;
    reason.push('Recent sales data.');
  } else if (avgCompRecency <= 6) {
    score += 5;
    reason.push('Moderately recent sales.');
  } else if (avgCompRecency <= 12) {
    score -= 5;
    reason.push('Older sales data.');
  } else {
    score -= 15;
    reason.push('Very old sales data.');
  }

  // HPI volatility: lower = higher confidence
  if (hpiVolatility < 0.03) {
    score += 15;
    reason.push('Stable HPI trend.');
  } else if (hpiVolatility < 0.06) {
    score += 5;
    reason.push('Moderate HPI volatility.');
  } else if (hpiVolatility < 0.10) {
    score -= 5;
    reason.push('High HPI volatility.');
  } else {
    score -= 15;
    reason.push('Very high HPI volatility.');
  }

  // Clamp score
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let rating: 'low' | 'medium' | 'high' = 'medium';
  if (score >= 80) rating = 'high';
  else if (score <= 40) rating = 'low';

  return {
    score,
    rating,
    reason: reason.join(' '),
  };
} 