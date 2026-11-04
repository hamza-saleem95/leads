import { DataNormalizer } from './normalizer.js';
import { DiscoveredBusiness, BusinessLeadDTO } from '../types/index.js';

export interface DeduplicationMatch {
  isDuplicate: boolean;
  matchReason?: 'DOMAIN_MATCH' | 'COMPANY_NAME_AND_LOCATION' | 'PHONE_MATCH' | 'ADDRESS_MATCH';
  confidence: number;
  existingLeadId?: string;
}

export class DeduplicationEngine {
  /**
   * Calculates Levenshtein Distance similarity ratio (0 to 1)
   */
  static stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.trim().toLowerCase();
    const s2 = str2.trim().toLowerCase();
    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0.0;

    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,       // deletion
          matrix[i][j - 1] + 1,       // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }

  /**
   * Detects whether candidate matches any lead in existing leads list
   */
  static findDuplicate(
    candidate: Partial<BusinessLeadDTO> | DiscoveredBusiness,
    existingLeads: BusinessLeadDTO[]
  ): { duplicate: BusinessLeadDTO | null; matchReason?: string; confidence: number } {
    const candidateDomain = DataNormalizer.normalizeDomain(candidate.website);
    const candidateNormName = DataNormalizer.normalizeCompanyName(candidate.companyName);
    const candidatePhone = DataNormalizer.normalizePhone(candidate.phone);
    const candidateAddress = DataNormalizer.normalizeAddress(candidate.address);
    const candidateCountry = candidate.country?.trim().toLowerCase();
    const candidateCity = candidate.city?.trim().toLowerCase();

    for (const lead of existingLeads) {
      const leadDomain = DataNormalizer.normalizeDomain(lead.website);
      const leadNormName = DataNormalizer.normalizeCompanyName(lead.companyName);
      const leadPhone = DataNormalizer.normalizePhone(lead.phone);
      const leadAddress = DataNormalizer.normalizeAddress(lead.address);
      const leadCountry = lead.country?.trim().toLowerCase();
      const leadCity = lead.city?.trim().toLowerCase();

      // Rule 1: Normalized domain match (Strongest signal)
      if (candidateDomain && leadDomain && candidateDomain === leadDomain) {
        return {
          duplicate: lead,
          matchReason: 'DOMAIN_MATCH',
          confidence: 0.98,
        };
      }

      // Rule 2: Phone number match
      if (candidatePhone && leadPhone && candidatePhone === leadPhone) {
        return {
          duplicate: lead,
          matchReason: 'PHONE_MATCH',
          confidence: 0.95,
        };
      }

      // Rule 3: Company name similarity (> 0.85) AND matching location
      if (candidateNormName && leadNormName) {
        const nameSim = this.stringSimilarity(candidateNormName, leadNormName);
        if (nameSim >= 0.88) {
          const locationMatch = (candidateCountry && leadCountry && candidateCountry === leadCountry) ||
                                (candidateCity && leadCity && candidateCity === leadCity);
          if (locationMatch) {
            return {
              duplicate: lead,
              matchReason: 'COMPANY_NAME_AND_LOCATION',
              confidence: 0.90,
            };
          }
        }
      }

      // Rule 4: Address similarity (> 0.85) AND company name similarity (> 0.70)
      if (candidateAddress && leadAddress && candidateAddress.length > 10) {
        const addrSim = this.stringSimilarity(candidateAddress, leadAddress);
        if (addrSim > 0.85) {
          const nameSim = candidateNormName && leadNormName ? this.stringSimilarity(candidateNormName, leadNormName) : 0;
          if (nameSim > 0.65) {
            return {
              duplicate: lead,
              matchReason: 'ADDRESS_MATCH',
              confidence: 0.89,
            };
          }
        }
      }
    }

    return { duplicate: null, confidence: 0 };
  }

  /**
   * Merges incoming lead data into an existing lead, preserving provenance
   * Never overwrites verified or reliable data with missing/weaker data
   */
  static mergeLeads(target: BusinessLeadDTO, incoming: Partial<BusinessLeadDTO>): BusinessLeadDTO {
    const merged = { ...target };

    // Fill in missing website
    if (!merged.website && incoming.website) {
      merged.website = incoming.website;
    }

    // Preserve email if already verified, otherwise update if incoming has valid email
    if (incoming.email) {
      if (!merged.email || merged.emailStatus === 'UNKNOWN' || merged.emailStatus === 'UNVERIFIED') {
        merged.email = incoming.email;
        if (incoming.emailStatus) {
          merged.emailStatus = incoming.emailStatus;
        }
      }
    }

    // Fill in missing phone
    if (!merged.phone && incoming.phone) {
      merged.phone = incoming.phone;
    }

    // Fill in description if longer / better
    if ((!merged.businessDescription || (incoming.businessDescription && incoming.businessDescription.length > merged.businessDescription.length))) {
      merged.businessDescription = incoming.businessDescription;
    }

    // Fill in address / city / state / country
    if (!merged.address && incoming.address) merged.address = incoming.address;
    if (!merged.city && incoming.city) merged.city = incoming.city;
    if (!merged.state && incoming.state) merged.state = incoming.state;
    if (!merged.country && incoming.country) merged.country = incoming.country;

    // Fill in social URLs
    if (!merged.linkedinCompanyUrl && incoming.linkedinCompanyUrl) {
      merged.linkedinCompanyUrl = incoming.linkedinCompanyUrl;
    }
    if (!merged.contactPageUrl && incoming.contactPageUrl) {
      merged.contactPageUrl = incoming.contactPageUrl;
    }

    // Preserve Google Listing and Cold Calling readiness
    if (merged.isGoogleListed === undefined && incoming.isGoogleListed !== undefined) merged.isGoogleListed = incoming.isGoogleListed;
    if (!merged.googleMapsUrl && incoming.googleMapsUrl) merged.googleMapsUrl = incoming.googleMapsUrl;
    if (!merged.googleRating && incoming.googleRating) merged.googleRating = incoming.googleRating;
    if (!merged.googleReviewCount && incoming.googleReviewCount) merged.googleReviewCount = incoming.googleReviewCount;
    if (!merged.operatingStatus && incoming.operatingStatus) merged.operatingStatus = incoming.operatingStatus;
    if (merged.coldCallReady === undefined && incoming.coldCallReady !== undefined) merged.coldCallReady = incoming.coldCallReady;
    if (!merged.decisionMakerRole && incoming.decisionMakerRole) merged.decisionMakerRole = incoming.decisionMakerRole;
    if (!merged.callOpenerTip && incoming.callOpenerTip) merged.callOpenerTip = incoming.callOpenerTip;

    merged.updatedAt = new Date().toISOString();
    return merged;
  }
}
