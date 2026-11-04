import { ScoreBreakdown, BusinessLeadDTO } from '../types/index.js';
import { config } from '../config/index.js';

export interface ScoringCriteria {
  industry?: string;
  country?: string;
  cities?: string[];
  requiredFields?: string[];
}

export class LeadScoringEngine {
  /**
   * Calculates comprehensive quality score (0 - 100) and itemized breakdown
   */
  static scoreLead(
    lead: Partial<BusinessLeadDTO>,
    criteria?: ScoringCriteria
  ): { total: number; breakdown: ScoreBreakdown } {
    const weights = config.scoringWeights;
    const notes: string[] = [];

    // 1. Industry Relevance (Max 30)
    let industryScore = 0;
    if (criteria?.industry) {
      const targetIndustry = criteria.industry.toLowerCase();
      const leadIndustry = (lead.industry || '').toLowerCase();
      const leadDesc = (lead.businessDescription || '').toLowerCase();
      const companyName = (lead.companyName || '').toLowerCase();

      if (leadIndustry && leadIndustry.includes(targetIndustry)) {
        industryScore = weights.industryRelevance;
        notes.push(`Exact industry match: ${lead.industry}`);
      } else if (leadDesc.includes(targetIndustry) || companyName.includes(targetIndustry)) {
        industryScore = Math.round(weights.industryRelevance * 0.85);
        notes.push(`Keyword match in business profile or name`);
      } else {
        // Partial token match
        const targetTokens = targetIndustry.split(/\s+/).filter(t => t.length > 2);
        const matches = targetTokens.filter(t => leadDesc.includes(t) || leadIndustry.includes(t));
        if (matches.length > 0) {
          industryScore = Math.round(weights.industryRelevance * (matches.length / targetTokens.length) * 0.7);
          notes.push(`Partial industry keyword match (${matches.join(', ')})`);
        } else if (leadIndustry || leadDesc) {
          industryScore = Math.round(weights.industryRelevance * 0.4);
          notes.push(`Industry specified but low direct correlation`);
        }
      }
    } else {
      // If no criteria specified, give default score based on having industry or description
      if (lead.industry || lead.businessDescription) {
        industryScore = Math.round(weights.industryRelevance * 0.8);
      }
    }

    // 2. Location Match (Max 20)
    let locationScore = 0;
    if (criteria?.country) {
      const targetCountry = criteria.country.toLowerCase();
      const leadCountry = (lead.country || '').toLowerCase();
      const leadAddress = (lead.address || '').toLowerCase();

      const countryMatched = leadCountry.includes(targetCountry) || leadAddress.includes(targetCountry);
      if (countryMatched) {
        locationScore += 12; // 12 of 20 for country
      }

      if (criteria.cities && criteria.cities.length > 0) {
        const leadCity = (lead.city || '').toLowerCase();
        const cityMatch = criteria.cities.some(c => 
          leadCity.includes(c.toLowerCase()) || leadAddress.includes(c.toLowerCase())
        );
        if (cityMatch) {
          locationScore += 8; // remaining 8 for specific target city
          notes.push(`City target match`);
        } else if (countryMatched) {
          locationScore += 4; // partial if within target country
        }
      } else if (countryMatched) {
        locationScore += 8; // if no city requested, country match gets full
      }
    } else {
      if (lead.country || lead.city) {
        locationScore = Math.round(weights.locationMatch * 0.75);
      }
    }

    // 3. Website Availability (Max 10)
    let websiteScore = 0;
    if (lead.website && lead.website.trim().length > 3) {
      websiteScore = weights.websiteAvailability;
    } else {
      notes.push('No website available');
    }

    // 4. Public Business Email Availability (Max 15)
    let emailScore = 0;
    if (lead.email && lead.email.includes('@')) {
      if (lead.emailStatus === 'VERIFIED') {
        emailScore = weights.emailAvailability;
        notes.push('Verified business email');
      } else if (lead.emailStatus === 'UNVERIFIED' || lead.emailStatus === 'UNKNOWN') {
        // Check if corporate domain
        const emailDomain = lead.email.split('@')[1] || '';
        const isFreeMail = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'].includes(emailDomain);
        emailScore = isFreeMail ? Math.round(weights.emailAvailability * 0.7) : Math.round(weights.emailAvailability * 0.9);
      } else {
        emailScore = 0;
        notes.push('Invalid email detected');
      }
    } else {
      notes.push('No contact email found');
    }

    // 5. Phone Availability (Max 10)
    let phoneScore = 0;
    const hasValidPhone = Boolean(lead.phone && lead.phone.trim().length >= 6);
    if (hasValidPhone) {
      phoneScore = weights.phoneAvailability;
      notes.push('Direct dial telephone confirmed (Cold Call Ready)');
    } else {
      notes.push('No direct phone number');
    }

    // Google Presence Verification note
    const isGoogleListed = lead.isGoogleListed !== false;
    if (isGoogleListed) {
      notes.push('Verified business presence on Google Maps & Search');
    }

    // 6. Information Completeness (Max 10)
    let completenessScore = 0;
    if (lead.businessDescription && lead.businessDescription.length > 20) completenessScore += 3;
    if (lead.address && lead.address.length > 5) completenessScore += 3;
    if (lead.linkedinCompanyUrl) completenessScore += 2;
    if (lead.contactPageUrl) completenessScore += 2;
    completenessScore = Math.min(completenessScore, weights.completeness);

    // 7. Source Reliability (Max 5)
    let reliabilityScore = weights.sourceReliability;
    if (!lead.sourceProvider) {
      reliabilityScore = 2;
    }

    const total = Math.min(
      100,
      Math.max(0, industryScore + locationScore + websiteScore + emailScore + phoneScore + completenessScore + reliabilityScore)
    );

    const breakdown: ScoreBreakdown = {
      industryRelevance: industryScore,
      locationMatch: locationScore,
      websiteAvailability: websiteScore,
      emailAvailability: emailScore,
      phoneAvailability: phoneScore,
      completeness: completenessScore,
      sourceReliability: reliabilityScore,
      total,
      notes,
      googlePresenceVerified: isGoogleListed,
      coldCallReady: hasValidPhone,
    };

    return { total, breakdown };
  }
}
