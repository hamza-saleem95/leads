export type LeadStatus = 'NEW' | 'REVIEWED' | 'QUALIFIED' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
export type EmailStatus = 'VERIFIED' | 'INVALID' | 'UNVERIFIED' | 'UNKNOWN';
export type ExtractionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ScoreBreakdown {
  industryRelevance: number;
  locationMatch: number;
  websiteAvailability: number;
  emailAvailability: number;
  phoneAvailability: number;
  completeness: number;
  sourceReliability: number;
  total: number;
  notes?: string[];
}

export interface LeadNote {
  id: string;
  leadId: string;
  userId: string;
  note: string;
  createdAt: string;
}

export interface LeadSource {
  id: string;
  leadId: string;
  provider: string;
  sourceUrl: string;
  rawData?: any;
  collectedAt: string;
}

export interface BusinessLead {
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
  collectedAt: string;
  updatedAt: string;
  notes?: LeadNote[];
  sources?: LeadSource[];
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

export interface SearchProject {
  id: string;
  userId: string;
  name: string;
  industry: string;
  country: string;
  status: string;
  totalFound: number;
  configuration?: SearchStrategy;
  createdAt: string;
  updatedAt: string;
}

export interface SearchJob {
  id: string;
  searchProjectId: string;
  type: string;
  status: JobStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  errors?: any;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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
    excellent: number;
    good: number;
    average: number;
    low: number;
  };
  leadsByIndustry: { industry: string; count: number }[];
  leadsByCountry: { country: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    details: any;
    createdAt: string;
  }[];
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  isEnabled: boolean;
  apiKeyMasked?: string | null;
  isConfigured: boolean;
  testStatus: string;
  lastTestedAt?: string | null;
  lastError?: string | null;
}

export interface APIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalEstimatedCost: number;
  byProvider: Record<string, { requests: number; cost: number; tokens: number }>;
  recentLogs: {
    id: string;
    provider: string;
    endpoint: string;
    tokensUsed: number;
    estimatedCost: number;
    status: string;
    createdAt: string;
  }[];
}

export interface ProgressEventPayload {
  jobId: string;
  searchProjectId: string;
  stage: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  currentMessage: string;
  status: JobStatus;
  leadFound?: BusinessLead;
}
