// Enhanced Matching Engine with Additional Data Points
// Incorporates location proximity, placement success, preferences, and detailed explanations

const DEFAULT_WEIGHTS = {
  county_match: 18,
  funding_match: 18,
  gender_match: 12,
  age_match: 12,
  availability_match: 10,
  capability_match: 10,
  location_proximity: 8,
  placement_success: 6,
  preferences_match: 4,
  services_match: 2
};

const DEFAULT_CONSTRAINTS = {
  require_funding_match: true,
  require_county_proximity: false,
  max_county_distance: 50,
  require_gender_match: true,
  require_age_range_match: true,
  require_verified_license: true,
  max_distance_miles: 100
};

const DEFAULT_THRESHOLDS = {
  minimum_score: 40,
  good_score: 70,
  excellent_score: 85,
  max_results: 10
};

// Calculate distance score based on proximity (simplified)
function scoreLocationProximity(referralCounty, siteCounty, site, preferredDistance, weights) {
  if (!siteCounty || !referralCounty) return 0;
  
  // Same county = full score
  if (siteCounty.toLowerCase() === referralCounty.toLowerCase()) {
    return weights.location_proximity;
  }
  
  // Adjacent/nearby counties (simplified - in production would use actual lat/lon)
  // For now, use partial scoring based on preference
  if (preferredDistance) {
    // Assume average distance between counties is 30 miles
    const estimatedDistance = 30;
    if (estimatedDistance <= preferredDistance) {
      return weights.location_proximity * 0.7;
    } else if (estimatedDistance <= preferredDistance * 1.5) {
      return weights.location_proximity * 0.4;
    }
  }
  
  return weights.location_proximity * 0.3;
}

// Score placement success rate
function scorePlacementSuccess(opening, referral, weights) {
  const metrics = opening.placement_success_metrics;
  if (!metrics) return 0;
  
  let score = 0;
  const maxScore = weights.placement_success;
  
  // Success rate over 90 days
  if (metrics.total_placements_last_year > 0) {
    const successRate = metrics.successful_placements_90_days / metrics.total_placements_last_year;
    score += maxScore * 0.5 * successRate;
  }
  
  // Similar profile placements (bonus)
  if (metrics.similar_profile_placements > 0) {
    const similarBonus = Math.min(0.5, metrics.similar_profile_placements / 10);
    score += maxScore * similarBonus;
  }
  
  return score;
}

// Score preference matches
function scorePreferencesMatch(referral, opening, weights) {
  const clientPrefs = referral.client_preferences || {};
  const amenities = opening.amenities || {};
  
  let matchCount = 0;
  let totalPrefs = 0;
  
  // Pets
  if (clientPrefs.pets_allowed !== undefined) {
    totalPrefs++;
    if (clientPrefs.pets_allowed === amenities.pets_allowed) matchCount++;
  }
  
  // Community type
  if (clientPrefs.community_type && clientPrefs.community_type !== 'any') {
    totalPrefs++;
    if (clientPrefs.community_type === amenities.community_type) matchCount++;
  }
  
  // Private room
  if (clientPrefs.private_room) {
    totalPrefs++;
    if (amenities.private_rooms_available) matchCount++;
  }
  
  // Smoking
  if (clientPrefs.smoking_environment && clientPrefs.smoking_environment !== 'no_preference') {
    totalPrefs++;
    const needsSmoking = clientPrefs.smoking_environment === 'smoking_allowed';
    if (needsSmoking === amenities.smoking_permitted) matchCount++;
  }
  
  // Dietary restrictions
  if (clientPrefs.dietary_restrictions?.length > 0) {
    totalPrefs++;
    const hasAllDietary = clientPrefs.dietary_restrictions.every(diet =>
      amenities.dietary_accommodations?.some(d => d.toLowerCase().includes(diet.toLowerCase()))
    );
    if (hasAllDietary) matchCount++;
  }
  
  // Languages
  if (clientPrefs.language_needs?.length > 0) {
    totalPrefs++;
    const hasLanguage = clientPrefs.language_needs.some(lang =>
      amenities.languages_spoken?.some(l => l.toLowerCase().includes(lang.toLowerCase()))
    );
    if (hasLanguage) matchCount++;
  }
  
  if (totalPrefs === 0) return weights.preferences_match * 0.5;
  
  return weights.preferences_match * (matchCount / totalPrefs);
}

// Score services match
function scoreServicesMatch(referral, opening, weights) {
  const specificNeeds = referral.specific_needs || {};
  const services = opening.services_offered || {};
  const amenities = opening.amenities || {};
  
  let matchCount = 0;
  let totalNeeds = 0;
  
  // Transportation
  if (specificNeeds.transportation_to_services) {
    totalNeeds++;
    if (amenities.transportation_provided) matchCount++;
  }
  
  // Specialized therapy
  if (specificNeeds.specialized_therapy_access?.length > 0) {
    totalNeeds++;
    const hasTherapy = specificNeeds.specialized_therapy_access.every(therapy =>
      services.on_site_therapy?.some(t => t.toLowerCase().includes(therapy.toLowerCase()))
    );
    if (hasTherapy) matchCount += 0.8;
  }
  
  // Day program
  if (specificNeeds.day_program_access) {
    totalNeeds++;
    if (services.day_program_partnership) matchCount++;
  }
  
  // Wheelchair accessibility
  if (specificNeeds.wheelchair_accessible) {
    totalNeeds++;
    if (amenities.wheelchair_accessible) matchCount++;
  }
  
  if (totalNeeds === 0) return weights.services_match * 0.5;
  
  return weights.services_match * (matchCount / totalNeeds);
}

// Calculate score for county match
function scoreCountyMatch(referralCounty, openingCounties, siteCounty, weights) {
  if (!referralCounty) return 0;
  
  const countyLower = referralCounty.toLowerCase();
  
  if (siteCounty?.toLowerCase() === countyLower) {
    return weights.county_match;
  }
  
  if (openingCounties?.some(c => c.toLowerCase() === countyLower)) {
    return weights.county_match * 0.9;
  }
  
  return 0;
}

// Calculate score for funding match
function scoreFundingMatch(referralFunding, openingFunding, weights) {
  if (!referralFunding || !openingFunding?.length) return 0;
  
  const fundingUpper = referralFunding.toUpperCase();
  
  if (openingFunding.some(f => f.toUpperCase() === fundingUpper)) {
    return weights.funding_match;
  }
  
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
  
  if (!availableDate || new Date(availableDate) <= new Date()) {
    score *= 1.0;
  } else if (desiredDate) {
    const desired = new Date(desiredDate);
    const available = new Date(availableDate);
    
    if (available <= desired) {
      score *= 1.0;
    } else {
      const daysLate = Math.floor((available - desired) / (1000 * 60 * 60 * 24));
      score *= Math.max(0.3, 1 - (daysLate * 0.1));
    }
  }
  
  return score;
}

// Calculate capability match score
function scoreCapabilityMatch(referral, capabilityProfile, weights) {
  if (!capabilityProfile) return weights.capability_match * 0.5;
  
  let score = weights.capability_match;
  let penalties = 0;
  
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

// Main enhanced matching function
export function matchReferralToOpenings(referral, openings, organizations, sites, licenses, capabilityProfiles, config = {}) {
  const startTime = performance.now();
  
  const weights = { ...DEFAULT_WEIGHTS, ...config.weights };
  const constraints = { ...DEFAULT_CONSTRAINTS, ...config.constraints };
  const thresholds = { ...DEFAULT_THRESHOLDS, ...config.thresholds };
  
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
    if (opening.status !== 'active' || (opening.spots_available || 0) <= 0) continue;
    
    const org = orgMap[opening.organization_id];
    const site = siteMap[opening.site_id];
    const license = licenseMap[opening.organization_id];
    const capability = capabilityMap[`site_${opening.site_id}`] || capabilityMap[`org_${opening.organization_id}`];
    
    const constraintViolations = checkConstraints(referral, opening, org, site, license, constraints);
    
    if (constraintViolations.length > 0) {
      continue;
    }
    
    const scoreBreakdown = {
      county: scoreCountyMatch(referral.client_county, org?.counties_served, site?.county, weights),
      funding: scoreFundingMatch(referral.funding_source, opening.funding_accepted, weights),
      gender: scoreGenderMatch(referral.client_gender, opening.gender_requirement, weights),
      age: scoreAgeMatch(referral.client_age, opening.age_min, opening.age_max, weights),
      availability: scoreAvailability(opening.spots_available, opening.status, referral.desired_start_date, opening.available_date, weights),
      capability: scoreCapabilityMatch(referral, capability, weights),
      location_proximity: scoreLocationProximity(referral.client_county, site?.county, site, referral.client_preferences?.preferred_location_proximity, weights),
      placement_success: scorePlacementSuccess(opening, referral, weights),
      preferences: scorePreferencesMatch(referral, opening, weights),
      services: scoreServicesMatch(referral, opening, weights)
    };
    
    const totalScore = Object.values(scoreBreakdown).reduce((sum, s) => sum + s, 0);
    
    if (totalScore >= thresholds.minimum_score) {
      const matchExplanation = generateDetailedMatchExplanation(scoreBreakdown, totalScore, opening, referral, org, site);
      
      results.push({
        opening_id: opening.id,
        opening,
        organization: org,
        site,
        score: Math.round(totalScore),
        score_breakdown: scoreBreakdown,
        match_explanation: matchExplanation,
        quality: totalScore >= thresholds.excellent_score ? 'excellent' : 
                 totalScore >= thresholds.good_score ? 'good' : 'fair'
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  
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

// Enhanced match explanation generator
export function generateDetailedMatchExplanation(scoreBreakdown, totalScore, opening, referral, org, site) {
  const scoredFactors = Object.entries(scoreBreakdown)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
  
  const factorLabels = {
    county: 'location in same county',
    funding: 'funding source compatibility',
    gender: 'gender alignment',
    age: 'age appropriateness',
    availability: 'immediate availability',
    capability: 'care capability match',
    location_proximity: 'proximity to client location',
    placement_success: 'proven placement success rate',
    preferences: 'client preference alignment',
    services: 'specialized services availability'
  };
  
  let explanation = '';
  
  // Quality descriptor
  if (totalScore >= 90) {
    explanation = '🌟 Excellent Match: ';
  } else if (totalScore >= 75) {
    explanation = '✅ Strong Match: ';
  } else if (totalScore >= 60) {
    explanation = '👍 Good Match: ';
  } else {
    explanation = '⚠️ Acceptable Match: ';
  }
  
  // Top 3 strengths
  const strengths = scoredFactors.slice(0, 3);
  const strengthDescriptions = strengths.map(([factor, score]) => {
    const percentage = Math.round((score / DEFAULT_WEIGHTS[factor]) * 100);
    return `${factorLabels[factor]} (${percentage}%)`;
  });
  
  explanation += strengthDescriptions.join(', ') + '. ';
  
  // Specific highlights
  const highlights = [];
  
  if (scoreBreakdown.placement_success > 0) {
    const metrics = opening.placement_success_metrics;
    if (metrics?.similar_profile_placements > 0) {
      highlights.push(`${metrics.similar_profile_placements} successful placements with similar client profiles`);
    }
  }
  
  if (scoreBreakdown.preferences > 0 && referral.client_preferences) {
    const prefs = [];
    if (referral.client_preferences.pets_allowed && opening.amenities?.pets_allowed) {
      prefs.push('pets allowed');
    }
    if (referral.client_preferences.private_room && opening.amenities?.private_rooms_available) {
      prefs.push('private room available');
    }
    if (prefs.length > 0) {
      highlights.push(`matches ${prefs.join(', ')}`);
    }
  }
  
  if (scoreBreakdown.services > 0) {
    const services = opening.services_offered;
    if (services?.on_site_therapy?.length > 0) {
      highlights.push(`offers ${services.on_site_therapy.join(', ')} therapy`);
    }
  }
  
  if (highlights.length > 0) {
    explanation += 'Notable: ' + highlights.join('; ') + '.';
  }
  
  // Considerations
  const weakFactors = scoredFactors.filter(([_, score]) => score < DEFAULT_WEIGHTS[_] * 0.5);
  if (weakFactors.length > 0 && totalScore < 85) {
    explanation += ` Review ${factorLabels[weakFactors[0][0]]} carefully.`;
  }
  
  return explanation;
}

// Identify risk flags
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