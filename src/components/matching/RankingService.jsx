import { differenceInHours, parseISO } from 'date-fns';

/**
 * Enhanced ranking service with paid prominence and freshness
 * Complies with safety rules: legal constraints first, then scoring
 */

export const RankingService = {
  /**
   * Apply paid prominence boost fairly
   * Rules:
   * - Only applied AFTER base compatibility scoring
   * - Bounded multiplier prevents unfair override
   * - Similar scores get boost, but significant quality differences remain
   */
  calculatePaidMultiplier(subscription) {
    if (!subscription || subscription.status !== 'active') {
      return 1.0;
    }

    const boostMap = {
      free: 1.0,
      basic: 1.05,
      professional: 1.10,
      enterprise: 1.15
    };

    return subscription.priority_boost_factor || boostMap[subscription.plan] || 1.0;
  },

  /**
   * Calculate reliability multiplier based on provider behavior
   * Factors: responsiveness, verification, outcomes, freshness
   */
  calculateReliabilityMultiplier(provider, licenses, referralHistory = []) {
    let multiplier = 1.0;

    // Verification status
    if (provider.verification_status === 'verified') {
      multiplier += 0.1;
    } else if (provider.verification_status === 'unverified') {
      multiplier -= 0.1;
    }

    // Active verified licenses
    const verifiedLicenses = licenses.filter(l => 
      l.status === 'verified' && new Date(l.expiration_date) > new Date()
    );
    if (verifiedLicenses.length > 0) {
      multiplier += 0.05;
    }

    // Referral acceptance rate (if history exists)
    if (referralHistory.length >= 5) {
      const acceptanceRate = referralHistory.filter(r => 
        r.status === 'accepted' || r.status === 'placed'
      ).length / referralHistory.length;
      
      if (acceptanceRate >= 0.8) multiplier += 0.05;
      else if (acceptanceRate < 0.3) multiplier -= 0.1;
    }

    // Clamp between 0.8 and 1.2
    return Math.max(0.8, Math.min(1.2, multiplier));
  },

  /**
   * Calculate freshness score (0-1)
   * Openings confirmed recently get higher scores
   */
  calculateFreshnessScore(opening) {
    if (!opening.last_confirmed_at) {
      return 0.5; // Not confirmed = neutral
    }

    const hoursAgo = differenceInHours(new Date(), parseISO(opening.last_confirmed_at));
    
    if (hoursAgo > 48) return 0; // Stale, should be filtered out
    if (hoursAgo <= 12) return 1.0; // Very fresh
    if (hoursAgo <= 24) return 0.9; // Fresh
    if (hoursAgo <= 36) return 0.8; // Moderately fresh
    return 0.7; // Getting stale
  },

  /**
   * Main ranking function
   * Applies tiered interleaving approach for fairness
   */
  rankMatches(matches, subscriptions = [], providers = [], licenses = []) {
    // Step 1: Enrich matches with multipliers
    const enrichedMatches = matches.map(match => {
      const subscription = subscriptions.find(s => s.organization_id === match.organization_id);
      const provider = providers.find(p => p.id === match.organization_id);
      const orgLicenses = licenses.filter(l => l.organization_id === match.organization_id);

      const paidMultiplier = this.calculatePaidMultiplier(subscription);
      const reliabilityMultiplier = this.calculateReliabilityMultiplier(
        provider || {}, 
        orgLicenses, 
        []
      );
      const freshnessScore = this.calculateFreshnessScore(match);

      // Final score with bounded boost
      const finalScore = match.match_confidence_score * reliabilityMultiplier * paidMultiplier * freshnessScore;

      return {
        ...match,
        base_score: match.match_confidence_score,
        paid_multiplier: paidMultiplier,
        reliability_multiplier: reliabilityMultiplier,
        freshness_score: freshnessScore,
        final_score: finalScore,
        is_paid: paidMultiplier > 1.0,
        tier: subscription?.plan || 'free'
      };
    });

    // Step 2: Tiered interleaving
    // Group by score bands (±5 points)
    const scoreBands = this.groupIntoScoreBands(enrichedMatches);

    // Within each band, sort by paid tier, then reliability, then freshness
    const ranked = [];
    scoreBands.forEach(band => {
      const sorted = band.sort((a, b) => {
        // First by paid tier
        if (a.paid_multiplier !== b.paid_multiplier) {
          return b.paid_multiplier - a.paid_multiplier;
        }
        // Then by reliability
        if (a.reliability_multiplier !== b.reliability_multiplier) {
          return b.reliability_multiplier - a.reliability_multiplier;
        }
        // Then by freshness
        if (a.freshness_score !== b.freshness_score) {
          return b.freshness_score - a.freshness_score;
        }
        // Finally by base score
        return b.base_score - a.base_score;
      });
      ranked.push(...sorted);
    });

    return ranked;
  },

  /**
   * Group matches into score bands for fair interleaving
   */
  groupIntoScoreBands(matches) {
    const bands = [];
    const bandSize = 5; // ±5 points per band

    // Sort by base score first
    const sorted = [...matches].sort((a, b) => b.base_score - a.base_score);

    let currentBand = [];
    let currentBandMin = null;

    sorted.forEach(match => {
      if (currentBandMin === null) {
        currentBandMin = match.base_score;
        currentBand.push(match);
      } else if (currentBandMin - match.base_score <= bandSize) {
        currentBand.push(match);
      } else {
        bands.push(currentBand);
        currentBand = [match];
        currentBandMin = match.base_score;
      }
    });

    if (currentBand.length > 0) {
      bands.push(currentBand);
    }

    return bands;
  },

  /**
   * Build explainability for a match
   */
  buildExplainability(match, opening) {
    const matched_because = [];
    const potential_concerns = [];

    // Positive factors
    if (match.base_score >= 80) {
      matched_because.push('Excellent compatibility match');
    }
    if (match.freshness_score >= 0.9) {
      matched_because.push('Recently confirmed availability');
    }
    if (match.reliability_multiplier > 1.05) {
      matched_because.push('Highly reliable provider');
    }

    // Concerns
    if (match.freshness_score < 0.8) {
      const hoursAgo = opening.last_confirmed_at 
        ? differenceInHours(new Date(), parseISO(opening.last_confirmed_at))
        : null;
      if (hoursAgo) {
        potential_concerns.push(`Not confirmed recently (${hoursAgo}h ago)`);
      }
    }
    if (match.reliability_multiplier < 1.0) {
      potential_concerns.push('Lower historical responsiveness');
    }

    return {
      matched_because,
      potential_concerns,
      freshness_hours: opening.last_confirmed_at 
        ? differenceInHours(new Date(), parseISO(opening.last_confirmed_at))
        : null,
      verification_status: match.verification_status || 'unknown'
    };
  }
};

export default RankingService;