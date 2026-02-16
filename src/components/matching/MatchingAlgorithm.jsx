// Matching Engine Algorithm
// Scores openings against referral criteria using configurable weights

const DEFAULT_WEIGHTS = {
  county_match: 25,
  funding_match: 20,
  gender_match: 15,
  age_match: 15,
  availability_match: 15,
  capability_match: 10
};

const DEFAULT_CONSTRAINTS = {
  require_funding_match: true,
  require_county_proximity: false,
  max_county_distance: 50,
  require_gender_match: true,
  require_age_range_match: true,
  require_verified_license: true
};

const DEFAULT_THRESHOLDS = {
  minimum_score: 40,
  good_score: 70,
  excellent_score: 85,
  max_results: 10
};

// Calculate score for county match
function scoreCountyMatch(referralCounty, openingCounties, siteCounty, weights) {
  if (!referralCounty) return 0;
  
  const countyLower = referralCounty.toLowerCase();
  
  // Exact match with site county
  if (siteCounty?.toLowerCase() === countyLower) {
    return weights.county_match;
  }
  
  // Match with provider's served counties
  if (openingCounties?.some(c => c.toLowerCase() === countyLower)) {
    return weights.county_match * 0.9;
  }
  
  // Adjacent county (simplified - could use actual adjacency data)
  return 0;
}

// Calculate score for funding match
function scoreFundingMatch(referralFunding, openingFunding, weights) {
  if (!referralFunding || !openingFunding?.length) return 0;
  
  const fundingUpper = referralFunding.toUpperCase();
  
  if (openingFunding.some(f => f.toUpperCase() === fundingUpper)) {
    return weights.funding_match;
  }
  
  // Partial match for compatible funding types
  if (fundingUpper.includes('MA') && openingFunding.some(f => f.includes('MA'))) {
    return weights.funding_match * 0.7;
  }
  
  return 0;
}

// Calculate score for gender match
function scoreGenderMatch(clientGender, openingGender, weights) {
  if (!clientGender || !openingGender || openingGender === 'any') {
    return weights.gender_match;
  }
  
  if (clientGender.toLowerCase() === openingGender.toLowerCase()) {
    return weights.gender_match;
  }
  
  return 0;
}

// Calculate score for age match
function scoreAgeMatch(clientAge, openingAgeMin, openingAgeMax, weights) {
  if (!clientAge) return weights.age_match * 0.5;
  
  const hasMin = openingAgeMin !== undefined && openingAgeMin !== null;
  const hasMax = openingAgeMax !== undefined && openingAgeMax !== null;
  
  if (!hasMin && !hasMax) return weights.age_match;
  
  const meetsMin = !hasMin || clientAge >= openingAgeMin;
  const meetsMax = !hasMax || clientAge <= openingAgeMax;
  
  if (meetsMin && meetsMax) return weights.age_match;
  
  // Partial score if close to range
  const minDiff = hasMin && clientAge < openingAgeMin ? openingAgeMin - clientAge : 0;
  const maxDiff = hasMax && clientAge > openingAgeMax ? clientAge - openingAgeMax : 0;
  const totalDiff = minDiff + maxDiff;
  
  if (totalDiff <= 2) return weights.age_match * 0.5;
  
  return 0;
}

// Calculate score for availability
function scoreAvailability(openingSpots, openingStatus, desiredDate, availableDate, weights) {
  if (openingStatus !== 'active' || (openingSpots || 0) <= 0) return 0;
  
  let score = weights.availability_match;
  
  // Bonus for immediate availability
  if (!availableDate || new Date(availableDate) <= new Date()) {
    score *= 1.0;
  } else if (desiredDate) {
    const desired = new Date(desiredDate);
    const available = new Date(availableDate);
    
    if (available <= desired) {
      score *= 1.0;
    } else {
      // Reduce score based on how far past desired date
      const daysLate = Math.floor((available - desired) / (1000 * 60 * 60 * 24));
      score *= Math.max(0.3, 1 - (daysLate * 0.1));
    }
  }
  
  return score;
}

// Calculate capability match score (simplified)
function scoreCapabilityMatch(referral, capabilityProfile, weights) {
  if (!capabilityProfile) return weights.capability_match * 0.5;
  
  let score = weights.capability_match;
  let penalties = 0;
  
  // Check behavioral needs (from referral summary keywords)
  const behavioralSummary = (referral.behavioral_summary || '').toLowerCase();
  
  if (behavioralSummary.includes('aggression') || behavioralSummary.includes('aggressive')) {
    const capLevel = capabilityProfile.behavioral?.aggression_physical;
    if (capLevel === 'none') penalties += 0.4;
    else if (capLevel === 'mild' && behavioralSummary.includes('severe')) penalties += 0.3;
  }
  
  if (behavioralSummary.includes('elopement') || behavioralSummary.includes('wander')) {
    const capLevel = capabilityProfile.behavioral?.elopement_risk;
    if (capLevel === 'none' || capLevel === 'low') penalties += 0.3;
  }
  
  // Check medical needs
  const medicalSummary = (referral.medical_summary || '').toLowerCase();
  
  if (medicalSummary.includes('tube feed') || medicalSummary.includes('g-tube')) {
    if (!capabilityProfile.medical?.tube_feeding) penalties += 0.5;
  }
  
  if (medicalSummary.includes('ventilator') || medicalSummary.includes('vent')) {
    if (!capabilityProfile.medical?.ventilator) penalties += 0.5;
  }
  
  if (medicalSummary.includes('seizure')) {
    const capLevel = capabilityProfile.medical?.seizure_management;
    if (capLevel === 'none') penalties += 0.3;
  }
  
  return score * Math.max(0, 1 - penalties);
}

// Check hard constraints
function checkConstraints(referral, opening, org, site, license, constraints) {
  const violations = [];
  
  if (constraints.require_funding_match) {
    const hasFunding = opening.funding_accepted?.some(f => 
      f.toUpperCase() === referral.funding_source?.toUpperCase()
    );
    if (!hasFunding) {
      violations.push({ type: 'funding', message: 'Funding source not accepted' });
    }
  }
  
  if (constraints.require_gender_match && opening.gender_requirement && opening.gender_requirement !== 'any') {
    if (referral.client_gender && referral.client_gender !== opening.gender_requirement) {
      violations.push({ type: 'gender', message: 'Gender requirement not met' });
    }
  }
  
  if (constraints.require_age_range_match && referral.client_age) {
    if (opening.age_min && referral.client_age < opening.age_min) {
      violations.push({ type: 'age', message: 'Client below minimum age' });
    }
    if (opening.age_max && referral.client_age > opening.age_max) {
      violations.push({ type: 'age', message: 'Client above maximum age' });
    }
  }
  
  if (constraints.require_verified_license && license) {
    if (license.status !== 'verified') {
      violations.push({ type: 'license', message: 'License not verified' });
    }
  }
  
  return violations;
}

// Main matching function
export function matchReferralToOpenings(referral, openings, organizations, sites, licenses, capabilityProfiles, config = {}) {
  const startTime = performance.now();
  
  const weights = { ...DEFAULT_WEIGHTS, ...config.weights };
  const constraints = { ...DEFAULT_CONSTRAINTS, ...config.constraints };
  const thresholds = { ...DEFAULT_THRESHOLDS, ...config.thresholds };
  
  // Build lookup maps
  const orgMap = organizations.reduce((acc, o) => ({ ...acc, [o.id]: o }), {});
  const siteMap = sites.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
  const licenseMap = licenses.reduce((acc, l) => ({ ...acc, [l.organization_id]: l }), {});
  const capabilityMap = capabilityProfiles.reduce((acc, c) => {
    if (c.site_id) acc[`site_${c.site_id}`] = c;
    else if (c.organization_id) acc[`org_${c.organization_id}`] = c;
    return acc;
  }, {});
  
  const results = [];
  
  for (const opening of openings) {
    // Skip inactive openings
    if (opening.status !== 'active' || (opening.spots_available || 0) <= 0) continue;
    
    const org = orgMap[opening.organization_id];
    const site = siteMap[opening.site_id];
    const license = licenseMap[opening.organization_id];
    const capability = capabilityMap[`site_${opening.site_id}`] || capabilityMap[`org_${opening.organization_id}`];
    
    // Check hard constraints
    const constraintViolations = checkConstraints(referral, opening, org, site, license, constraints);
    
    if (constraintViolations.length > 0) {
      continue; // Skip openings that violate hard constraints
    }
    
    // Calculate scores
    const scoreBreakdown = {
      county: scoreCountyMatch(referral.client_county, org?.counties_served, site?.county, weights),
      funding: scoreFundingMatch(referral.funding_source, opening.funding_accepted, weights),
      gender: scoreGenderMatch(referral.client_gender, opening.gender_requirement, weights),
      age: scoreAgeMatch(referral.client_age, opening.age_min, opening.age_max, weights),
      availability: scoreAvailability(opening.spots_available, opening.status, referral.desired_start_date, opening.available_date, weights),
      capability: scoreCapabilityMatch(referral, capability, weights)
    };
    
    const totalScore = Object.values(scoreBreakdown).reduce((sum, s) => sum + s, 0);
    
    // Only include if above minimum threshold
    if (totalScore >= thresholds.minimum_score) {
      results.push({
        opening_id: opening.id,
        opening,
        organization: org,
        site,
        score: Math.round(totalScore),
        score_breakdown: scoreBreakdown,
        quality: totalScore >= thresholds.excellent_score ? 'excellent' : 
                 totalScore >= thresholds.good_score ? 'good' : 'fair'
      });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  // Limit results
  const limitedResults = results.slice(0, thresholds.max_results);
  
  const endTime = performance.now();
  
  return {
    results: limitedResults,
    meta: {
      openings_searched: openings.length,
      matches_found: limitedResults.length,
      top_match_score: limitedResults[0]?.score || 0,
      avg_match_score: limitedResults.length > 0 
        ? Math.round(limitedResults.reduce((sum, r) => sum + r.score, 0) / limitedResults.length)
        : 0,
      latency_ms: Math.round(endTime - startTime),
      config_used: { weights, constraints, thresholds }
    }
  };
}

// AI-Enhanced Match Explanation Generator
export function generateMatchExplanation(scoreBreakdown, totalScore) {
  const topFactors = Object.entries(scoreBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  
  const factorLabels = {
    county: 'location match',
    funding: 'funding compatibility',
    gender: 'gender alignment',
    age: 'age appropriateness',
    availability: 'immediate availability',
    capability: 'care capability fit'
  };
  
  if (totalScore >= 90) {
    return `Excellent match! Perfect ${factorLabels[topFactors[0][0]]} and strong ${factorLabels[topFactors[1][0]]}.`;
  } else if (totalScore >= 75) {
    return `Strong fit with ${factorLabels[topFactors[0][0]]} (${Math.round(topFactors[0][1])}%) and ${factorLabels[topFactors[1][0]]} (${Math.round(topFactors[1][1])}%).`;
  } else if (totalScore >= 60) {
    return `Good ${factorLabels[topFactors[0][0]]}, viable option for placement consideration.`;
  } else {
    return `Acceptable match on ${factorLabels[topFactors[0][0]]}, review other criteria carefully.`;
  }
}

// Identify risk flags from referral
export function identifyRiskFlags(referral, matchResult) {
  const flags = [];
  
  const behavioral = (referral.behavioral_summary || '').toLowerCase();
  const medical = (referral.medical_summary || '').toLowerCase();
  
  if (behavioral.includes('aggression') || behavioral.includes('violence')) {
    flags.push('Physical aggression noted');
  }
  if (behavioral.includes('self-harm') || behavioral.includes('self-injury')) {
    flags.push('Self-injurious behavior');
  }
  if (behavioral.includes('elopement') || behavioral.includes('flight risk')) {
    flags.push('Elopement risk');
  }
  if (medical.includes('ventilator') || medical.includes('trach')) {
    flags.push('Complex medical needs');
  }
  if (referral.urgency === 'crisis') {
    flags.push('Crisis placement');
  }
  
  if (matchResult && matchResult.score < 60) {
    flags.push('Low match confidence');
  }
  
  return flags;
}

export { DEFAULT_WEIGHTS, DEFAULT_CONSTRAINTS, DEFAULT_THRESHOLDS };