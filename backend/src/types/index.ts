export type LeadStatus = 'NEW' | 'REVIEWED' | 'QUALIFIED' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
export type EmailStatus = 'VERIFIED' | 'INVALID' | 'UNVERIFIED' | 'UNKNOWN';
export type ExtractionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ScoreBreakdown {
  industryRelevance: number; // max 30
  locationMatch: number;     // max 20
  websiteAvailability: number; // max 10
  emailAvailability: number;   // max 15
  phoneAvailability: number;   // max 10
  completeness: number;        // max 10
  sourceReliability: number;   // max 5
  total: number;               // 0 to 100
  notes?: string[];
  googlePresenceVerified?: boolean;
  coldCallReady?: boolean;
}

export interface BusinessLeadDTO {
  id: string;
  userId: string;
  searchProjectId?: string | null;
  companyName: string;
  industry?: string | null;
  businessDescription?: string | null;
  website?: string | null;
  email?: string | null;
  emailStatus: EmailStatus;
  phone?: string | null;
  phoneStatus?: 'VERIFIED' | 'VALID_FORMAT' | 'UNVERIFIED' | 'INVALID';
  isGoogleListed?: boolean;
  gmbVerified?: boolean;
  gmbCategory?: string | null;
  googleMapsUrl?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  operatingStatus?: 'OPERATIONAL' | 'PERMANENTLY_CLOSED' | 'TEMPORARILY_CLOSED';
  coldCallReady?: boolean;
  decisionMakerRole?: string | null;
  callOpenerTip?: string | null;
  // Executive Leadership & Decision Maker (CEO / Owner / Founder)
  ceoName?: string | null;
  ceoTitle?: string | null;
  ceoLinkedinUrl?: string | null;
  ceoPhone?: string | null;
  ceoEmail?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  linkedinCompanyUrl?: string | null;
  contactPageUrl?: string | null;
  leadScore: number;
  scoreBreakdown?: ScoreBreakdown | null;
  leadStatus: LeadStatus;
  sourceUrl?: string | null;
  sourceProvider?: string | null;
  extractionStatus: ExtractionStatus;
  collectedAt: string | Date;
  updatedAt: string | Date;
  notes?: LeadNoteDTO[];
  sources?: LeadSourceDTO[];
}

export interface LeadSourceDTO {
  id: string;
  leadId: string;
  provider: string;
  sourceUrl: string;
  rawData?: any;
  collectedAt: string | Date;
}

export interface LeadNoteDTO {
  id: string;
  leadId: string;
  userId: string;
  note: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SearchStrategy {
  industry: string;
  country: string;
  cities: string[];
  quantity: number;
  businessType?: string;
  requiredFields: string[];
  additionalRequirements?: string;
  targetKeywords: string[];
  searchQueries: { query: string; provider: string }[];
  suggestedProviders: string[];
  rationale: string;
}

export interface DiscoveredBusiness {
  companyName: string;
  website?: string;
  industry?: string;
  businessDescription?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  sourceUrl: string;
  sourceProvider: string;
  rawMetadata?: Record<string, any>;
}

export interface ExtractionResult {
  url: string;
  companyName?: string;
  businessDescription?: string;
  emails: string[];
  phones: string[];
  address?: string;
  contactPageUrl?: string;
  linkedinUrl?: string;
  services?: string[];
  status: ExtractionStatus;
  errorMessage?: string;
}

export interface ProviderTestResult {
  provider: string;
  status: 'CONNECTED' | 'ERROR' | 'AWAITING_CREDENTIALS';
  message: string;
  latencyMs?: number;
  details?: any;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string | Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface DashboardStats {
  totalLeads: number;
  leadsDiscovered: number;
  emailsFound: number;
  verifiedEmails: number;
  phonesFound: number;
  totalSearchProjects: number;
  activeSearches: number;
  estimatedApiCosts: number;
  scoreDistribution: {
    excellent: number; // 80-100
    good: number;      // 60-79
    average: number;   // 40-59
    low: number;       // 0-39
  };
  leadsByIndustry: { industry: string; count: number }[];
  leadsByCountry: { country: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    details: any;
    createdAt: string | Date;
  }[];
}
