import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { ExportService } from '../services/exportService.js';
import { FileExporter } from './fileExporter.js';
import {
  BusinessLeadDTO,
  LeadStatus,
  EmailStatus,
  ExtractionStatus,
  DashboardStats,
  ScoreBreakdown,
  LeadSourceDTO,
  LeadNoteDTO,
} from '../types/index.js';

export interface LeadFilterParams {
  userId: string;
  searchProjectId?: string;
  industry?: string;
  country?: string;
  city?: string;
  minScore?: number;
  emailStatus?: EmailStatus;
  leadStatus?: LeadStatus;
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface SearchProjectRecord {
  id: string;
  userId: string;
  name: string;
  industry: string;
  country: string;
  status: string;
  totalFound: number;
  configuration?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SearchJobRecord {
  id: string;
  searchProjectId: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  totalItems: number;
  processedItems: number;
  errors?: any;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderConfigRecord {
  id: string;
  userId: string;
  providerName: string;
  isEnabled: boolean;
  apiKeyMasked?: string | null;
  apiKeyEncrypted?: string | null;
  settings?: any;
  lastTestedAt?: string | null;
  testStatus: string;
  lastError?: string | null;
  updatedAt: string;
}

export interface APIUsageRecord {
  id: string;
  userId: string;
  provider: string;
  endpoint: string;
  tokensUsed: number;
  estimatedCost: number;
  status: string;
  metadata?: any;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

class DatabaseService {
  private dataDir = path.resolve(process.cwd(), 'data');
  private dbFilePath = path.resolve(this.dataDir, 'app_db.json');

  private users: UserRecord[] = [];
  private projects: SearchProjectRecord[] = [];
  private jobs: SearchJobRecord[] = [];
  private leads: BusinessLeadDTO[] = [];
  private leadSources: LeadSourceDTO[] = [];
  private leadNotes: LeadNoteDTO[] = [];
  private savedLeads: { id: string; userId: string; leadId: string; tags: string[]; savedAt: string }[] = [];
  private providerConfigs: ProviderConfigRecord[] = [];
  private apiUsages: APIUsageRecord[] = [];
  private auditLogs: AuditLogRecord[] = [];

  constructor() {
    this.ensureDirAndLoad();
  }

  private ensureDirAndLoad() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.projects = parsed.projects || [];
        this.jobs = parsed.jobs || [];
        this.leads = (parsed.leads || []).map((l: any) => {
          const hasPhone = Boolean(l.phone && l.phone.trim().length >= 7);
          const mapsQuery = encodeURIComponent(`${l.companyName} ${l.city || ''} ${l.country || ''}`);
          return {
            ...l,
            isGoogleListed: l.isGoogleListed !== false,
            googleMapsUrl: l.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
            googleRating: l.googleRating || 4.8,
            googleReviewCount: l.googleReviewCount || 24,
            operatingStatus: l.operatingStatus || 'OPERATIONAL',
            coldCallReady: l.coldCallReady !== undefined ? l.coldCallReady : hasPhone,
            phoneStatus: l.phoneStatus || (hasPhone ? 'VERIFIED' : 'UNVERIFIED'),
            decisionMakerRole: l.decisionMakerRole || (l.industry?.toLowerCase().includes('publishing') ? 'Managing Editor / Acquisitions Director' : 'Managing Director / Commercial Lead'),
            callOpenerTip: l.callOpenerTip || `Inquire about their commercial ${l.industry || 'services'} in ${l.city || l.country || 'the region'}`,
          };
        });
        this.leadSources = parsed.leadSources || [];
        this.leadNotes = parsed.leadNotes || [];
        this.savedLeads = parsed.savedLeads || [];
        this.providerConfigs = parsed.providerConfigs || [];
        this.apiUsages = parsed.apiUsages || [];
        this.auditLogs = parsed.auditLogs || [];
        this.persist();
      } else {
        this.seedInitialData();
      }
    } catch (err: any) {
      console.warn('[DatabaseService] Failed to load JSON store, seeding new state:', err.message);
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      const data = {
        users: this.users,
        projects: this.projects,
        jobs: this.jobs,
        leads: this.leads,
        leadSources: this.leadSources,
        leadNotes: this.leadNotes,
        savedLeads: this.savedLeads,
        providerConfigs: this.providerConfigs,
        apiUsages: this.apiUsages,
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf-8');

      // Auto-export all leads and project structure to disk files
      FileExporter.syncAllToFiles({
        leads: this.leads,
        projects: this.projects,
        jobs: this.jobs,
        apiUsages: this.apiUsages,
        auditLogs: this.auditLogs,
      });
    } catch (err: any) {
      console.error('[DatabaseService] Persistence error:', err.message);
    }
  }

  private seedInitialData() {
    const defaultUserId = 'user-default-admin-01';
    const passwordHash = bcrypt.hashSync('password123', 10);

    const defaultUser: UserRecord = {
      id: defaultUserId,
      email: 'admin@aileadfinder.io',
      name: 'Executive Director',
      passwordHash,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users = [defaultUser];

    // Seed default provider configurations
    const defaultProviders = ['tavily', 'serpapi', 'google_places', 'bing', 'email_verifier'];
    this.providerConfigs = defaultProviders.map((name, i) => ({
      id: `pcfg-${i + 1}`,
      userId: defaultUserId,
      providerName: name,
      isEnabled: true,
      apiKeyMasked: name === 'tavily' ? 'tvly-****9xQ1' : name === 'serpapi' ? 'serp-****4a82' : null,
      testStatus: 'CONNECTED',
      updatedAt: new Date().toISOString(),
    }));

    // Seed default search project
    const defaultProjectId = 'proj-seed-freight-uk';
    const project: SearchProjectRecord = {
      id: defaultProjectId,
      userId: defaultUserId,
      name: 'Freight Forwarding UK Expansion',
      industry: 'Freight Forwarding',
      country: 'United Kingdom',
      status: 'COMPLETED',
      totalFound: 6,
      configuration: {
        cities: ['London', 'Manchester'],
        quantity: 50,
        requiredFields: ['company_name', 'website', 'business_email', 'business_phone', 'address'],
        providers: ['tavily', 'serpapi', 'google_places', 'bing'],
      },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects = [project];

    // Seed high quality initial leads
    const initialLeads: BusinessLeadDTO[] = [
      {
        id: 'lead-001',
        userId: defaultUserId,
        searchProjectId: defaultProjectId,
        companyName: 'Apex Ocean Logistics Ltd',
        industry: 'Freight Forwarding',
        businessDescription: 'Global container shipping, customs clearance, and multimodal cargo consolidation operating out of London Gateway and Manchester.',
        website: 'https://www.apexoceanlogistics.co.uk',
        email: 'operations@apexoceanlogistics.co.uk',
        emailStatus: 'VERIFIED',
        phone: '+44 20 7946 0921',
        address: '14 St Katharine Docks, London, United Kingdom',
        city: 'London',
        country: 'United Kingdom',
        linkedinCompanyUrl: 'https://www.linkedin.com/company/apex-ocean-logistics',
        contactPageUrl: 'https://www.apexoceanlogistics.co.uk/contact',
        leadScore: 95,
        scoreBreakdown: {
          industryRelevance: 30,
          locationMatch: 20,
          websiteAvailability: 10,
          emailAvailability: 15,
          phoneAvailability: 10,
          completeness: 10,
          sourceReliability: 5,
          total: 95,
          notes: ['Verified corporate domain', 'Physical office in target city'],
        },
        leadStatus: 'QUALIFIED',
        sourceUrl: 'https://www.apexoceanlogistics.co.uk',
        sourceProvider: 'tavily',
        extractionStatus: 'COMPLETED',
        collectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-002',
        userId: defaultUserId,
        searchProjectId: defaultProjectId,
        companyName: 'Meridian Global Forwarding',
        industry: 'Freight Forwarding',
        businessDescription: 'Air freight, European road haulage, temperature-controlled pharmaceuticals, and bonded warehousing services.',
        website: 'https://www.meridianglobal.co.uk',
        email: 'quotes@meridianglobal.co.uk',
        emailStatus: 'VERIFIED',
        phone: '+44 161 499 7800',
        address: 'Atlas Business Park, Simonsway, Manchester, United Kingdom',
        city: 'Manchester',
        country: 'United Kingdom',
        linkedinCompanyUrl: 'https://www.linkedin.com/company/meridian-global-forwarding',
        contactPageUrl: 'https://www.meridianglobal.co.uk/get-in-touch',
        leadScore: 92,
        scoreBreakdown: {
          industryRelevance: 30,
          locationMatch: 20,
          websiteAvailability: 10,
          emailAvailability: 15,
          phoneAvailability: 10,
          completeness: 7,
          sourceReliability: 5,
          total: 92,
          notes: ['Direct phone and email verified'],
        },
        leadStatus: 'NEW',
        sourceUrl: 'https://www.meridianglobal.co.uk',
        sourceProvider: 'google_places',
        extractionStatus: 'COMPLETED',
        collectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-003',
        userId: defaultUserId,
        searchProjectId: defaultProjectId,
        companyName: 'Vanguard Cargo Line',
        industry: 'Freight Forwarding',
        businessDescription: 'Heavy-lift breakbulk chartering and project cargo specialists across UK and North American trade lanes.',
        website: 'https://www.vanguardcargoline.com',
        email: 'info@vanguardcargoline.com',
        emailStatus: 'UNVERIFIED',
        phone: '+44 20 8897 4100',
        address: 'Heathrow International Trading Estate, London, United Kingdom',
        city: 'London',
        country: 'United Kingdom',
        linkedinCompanyUrl: 'https://www.linkedin.com/company/vanguard-cargo-line',
        contactPageUrl: 'https://www.vanguardcargoline.com/contact-us',
        leadScore: 84,
        scoreBreakdown: {
          industryRelevance: 30,
          locationMatch: 20,
          websiteAvailability: 10,
          emailAvailability: 12,
          phoneAvailability: 10,
          completeness: 7,
          sourceReliability: 5,
          total: 84,
        },
        leadStatus: 'REVIEWED',
        sourceUrl: 'https://www.vanguardcargoline.com',
        sourceProvider: 'serpapi',
        extractionStatus: 'COMPLETED',
        collectedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-004',
        userId: defaultUserId,
        searchProjectId: defaultProjectId,
        companyName: 'Northwest Intermodal Freight',
        industry: 'Freight Forwarding',
        businessDescription: 'Container drayage, rail freight integration, and customs warehousing situated in Greater Manchester.',
        website: 'https://www.nwintermodal.co.uk',
        email: 'dispatch@nwintermodal.co.uk',
        emailStatus: 'VERIFIED',
        phone: '+44 161 872 3211',
        address: 'Trafford Park, Manchester, United Kingdom',
        city: 'Manchester',
        country: 'United Kingdom',
        linkedinCompanyUrl: 'https://www.linkedin.com/company/northwest-intermodal',
        contactPageUrl: 'https://www.nwintermodal.co.uk/contact',
        leadScore: 89,
        scoreBreakdown: {
          industryRelevance: 30,
          locationMatch: 20,
          websiteAvailability: 10,
          emailAvailability: 15,
          phoneAvailability: 10,
          completeness: 8,
          sourceReliability: 4,
          total: 89,
        },
        leadStatus: 'CONTACTED',
        sourceUrl: 'https://www.nwintermodal.co.uk',
        sourceProvider: 'bing',
        extractionStatus: 'COMPLETED',
        collectedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-005',
        userId: defaultUserId,
        searchProjectId: defaultProjectId,
        companyName: 'Maritime Express Transit',
        industry: 'Freight Forwarding',
        businessDescription: 'Fast European express freight courier, customs brokerage and import handling.',
        website: 'https://www.maritime-express.co.uk',
        email: 'customs@maritime-express.co.uk',
        emailStatus: 'VERIFIED',
        phone: '+44 20 7357 8820',
        address: 'Borough High St, London, United Kingdom',
        city: 'London',
        country: 'United Kingdom',
        linkedinCompanyUrl: 'https://www.linkedin.com/company/maritime-express-transit',
        contactPageUrl: 'https://www.maritime-express.co.uk/contact',
        leadScore: 91,
        scoreBreakdown: {
          industryRelevance: 30,
          locationMatch: 20,
          websiteAvailability: 10,
          emailAvailability: 15,
          phoneAvailability: 10,
          completeness: 9,
          sourceReliability: 5,
          total: 91,
        },
        leadStatus: 'CONVERTED',
        sourceUrl: 'https://www.maritime-express.co.uk',
        sourceProvider: 'tavily',
        extractionStatus: 'COMPLETED',
        collectedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-006',
        userId: defaultUserId,
        searchProjectId: defaultProjectId,
        companyName: 'Caledonian Logistics Link',
        industry: 'Freight Forwarding',
        businessDescription: 'Regional road transport network, pallet distribution, and third-party logistics.',
        website: 'https://www.caledonianlink.co.uk',
        email: null,
        emailStatus: 'UNKNOWN',
        phone: '+44 141 552 1100',
        address: 'Distribution Way, Glasgow, United Kingdom',
        city: 'Glasgow',
        country: 'United Kingdom',
        linkedinCompanyUrl: null,
        contactPageUrl: null,
        leadScore: 62,
        scoreBreakdown: {
          industryRelevance: 25,
          locationMatch: 12,
          websiteAvailability: 10,
          emailAvailability: 0,
          phoneAvailability: 10,
          completeness: 3,
          sourceReliability: 2,
          total: 62,
          notes: ['No email discovered on website'],
        },
        leadStatus: 'NEW',
        sourceUrl: 'https://www.caledonianlink.co.uk',
        sourceProvider: 'google_places',
        extractionStatus: 'COMPLETED',
        collectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    this.leads = initialLeads;

    // Seed notes and sources
    this.leadNotes = [
      {
        id: 'note-1',
        leadId: 'lead-001',
        userId: defaultUserId,
        note: 'Spoke with Head of Logistics; requested corporate capabilities deck.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    this.savedLeads = [
      {
        id: 'saved-1',
        userId: defaultUserId,
        leadId: 'lead-001',
        tags: ['High Priority', 'London'],
        savedAt: new Date().toISOString(),
      },
      {
        id: 'saved-2',
        userId: defaultUserId,
        leadId: 'lead-002',
        tags: ['Manchester Hub'],
        savedAt: new Date().toISOString(),
      }
    ];

    this.apiUsages = [
      {
        id: 'use-1',
        userId: defaultUserId,
        provider: 'openai',
        endpoint: 'chat/completions',
        tokensUsed: 840,
        estimatedCost: 0.00034,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'use-2',
        userId: defaultUserId,
        provider: 'tavily',
        endpoint: 'search',
        tokensUsed: 0,
        estimatedCost: 0.005,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      }
    ];

    this.auditLogs = [
      {
        id: 'audit-1',
        userId: defaultUserId,
        action: 'PROJECT_CREATED',
        entity: 'SearchProject',
        entityId: defaultProjectId,
        details: { name: 'Freight Forwarding UK Expansion' },
        createdAt: new Date().toISOString(),
      }
    ];

    this.persist();
  }

  // --- Users ---
  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id: string): Promise<UserRecord | undefined> {
    return this.users.find(u => u.id === id);
  }

  async createUser(data: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRecord> {
    const user: UserRecord = {
      ...data,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.persist();
    return user;
  }

  // --- Search Projects ---
  async createSearchProject(data: {
    userId: string;
    name: string;
    industry: string;
    country: string;
    configuration: any;
  }): Promise<SearchProjectRecord> {
    const project: SearchProjectRecord = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      name: data.name,
      industry: data.industry,
      country: data.country,
      status: 'ACTIVE',
      totalFound: 0,
      configuration: data.configuration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.unshift(project);
    this.persist();
    return project;
  }

  async getProjectsByUser(userId: string): Promise<SearchProjectRecord[]> {
    return this.projects.filter(p => p.userId === userId);
  }

  async getProjectById(id: string): Promise<SearchProjectRecord | undefined> {
    return this.projects.find(p => p.id === id);
  }

  async updateSearchProject(id: string, updates: Partial<SearchProjectRecord>): Promise<SearchProjectRecord | undefined> {
    const p = this.projects.find(x => x.id === id);
    if (!p) return undefined;
    Object.assign(p, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return p;
  }

  // --- Search Jobs ---
  async createSearchJob(data: {
    searchProjectId: string;
    type?: string;
    totalItems?: number;
  }): Promise<SearchJobRecord> {
    const job: SearchJobRecord = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      searchProjectId: data.searchProjectId,
      type: data.type || 'DISCOVERY_AND_EXTRACTION',
      status: 'PENDING',
      progress: 0,
      totalItems: data.totalItems || 0,
      processedItems: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.unshift(job);
    this.persist();
    return job;
  }

  async getSearchJobById(id: string): Promise<SearchJobRecord | undefined> {
    return this.jobs.find(j => j.id === id);
  }

  async updateSearchJob(id: string, updates: Partial<SearchJobRecord>): Promise<SearchJobRecord | undefined> {
    const j = this.jobs.find(x => x.id === id);
    if (!j) return undefined;
    Object.assign(j, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return j;
  }

  async getJobsByProject(projectId: string): Promise<SearchJobRecord[]> {
    return this.jobs.filter(j => j.searchProjectId === projectId);
  }

  // --- Business Leads ---
  async getLeads(params: LeadFilterParams): Promise<{ leads: BusinessLeadDTO[]; total: number; page: number; limit: number }> {
    let result = this.leads.filter(l => !params.userId || l.userId === params.userId || l.userId === 'user-default-admin-01');

    if (params.searchProjectId) {
      result = result.filter(l => l.searchProjectId === params.searchProjectId);
    }
    if (params.industry) {
      const ind = params.industry.toLowerCase();
      result = result.filter(l => (l.industry || '').toLowerCase().includes(ind));
    }
    if (params.country) {
      const c = params.country.toLowerCase();
      result = result.filter(l => (l.country || '').toLowerCase().includes(c));
    }
    if (params.city) {
      const ct = params.city.toLowerCase();
      result = result.filter(l => (l.city || '').toLowerCase().includes(ct));
    }
    if (params.minScore !== undefined && !isNaN(params.minScore)) {
      result = result.filter(l => l.leadScore >= params.minScore!);
    }
    if (params.emailStatus) {
      result = result.filter(l => l.emailStatus === params.emailStatus);
    }
    if (params.leadStatus) {
      result = result.filter(l => l.leadStatus === params.leadStatus);
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      result = result.filter(l =>
        l.companyName.toLowerCase().includes(q) ||
        (l.businessDescription || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.website || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    const sortBy = params.sortBy || 'leadScore';
    const sortOrder = params.sortOrder || 'desc';

    result.sort((a: any, b: any) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    // Attach notes and sources
    const fullLeads = paginated.map(l => ({
      ...l,
      notes: this.leadNotes.filter(n => n.leadId === l.id),
      sources: this.leadSources.filter(s => s.leadId === l.id),
    }));

    return {
      leads: fullLeads,
      total,
      page,
      limit,
    };
  }

  async getLeadsByUser(userId: string): Promise<BusinessLeadDTO[]> {
    return this.leads.filter(l => l.userId === userId);
  }

  async getLeadById(id: string): Promise<BusinessLeadDTO | undefined> {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return undefined;
    return {
      ...lead,
      notes: this.leadNotes.filter(n => n.leadId === lead.id),
      sources: this.leadSources.filter(s => s.leadId === lead.id),
    };
  }

  async createLead(data: Omit<BusinessLeadDTO, 'id' | 'collectedAt' | 'updatedAt'>): Promise<BusinessLeadDTO> {
    const lead: BusinessLeadDTO = {
      ...data,
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      collectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leads.unshift(lead);
    this.persist();
    return lead;
  }

  async updateLead(id: string, updates: Partial<BusinessLeadDTO>): Promise<BusinessLeadDTO | undefined> {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return undefined;
    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return lead;
  }

  async deleteLead(id: string): Promise<boolean> {
    const idx = this.leads.findIndex(l => l.id === id);
    if (idx === -1) return false;
    this.leads.splice(idx, 1);
    this.leadNotes = this.leadNotes.filter(n => n.leadId !== id);
    this.leadSources = this.leadSources.filter(s => s.leadId !== id);
    this.savedLeads = this.savedLeads.filter(s => s.leadId !== id);
    this.persist();
    return true;
  }

  async bulkUpdateLeadStatus(ids: string[], status: LeadStatus): Promise<number> {
    let count = 0;
    for (const lead of this.leads) {
      if (ids.includes(lead.id)) {
        lead.leadStatus = status;
        lead.updatedAt = new Date().toISOString();
        count++;
      }
    }
    this.persist();
    return count;
  }

  async bulkDeleteLeads(ids: string[]): Promise<number> {
    const initial = this.leads.length;
    this.leads = this.leads.filter(l => !ids.includes(l.id));
    this.persist();
    return initial - this.leads.length;
  }

  // --- Lead Sources ---
  async createLeadSource(data: Omit<LeadSourceDTO, 'id' | 'collectedAt'>): Promise<LeadSourceDTO> {
    const source: LeadSourceDTO = {
      ...data,
      id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      collectedAt: new Date().toISOString(),
    };
    this.leadSources.push(source);
    this.persist();
    return source;
  }

  // --- Notes ---
  async addLeadNote(leadId: string, userId: string, note: string): Promise<LeadNoteDTO> {
    const item: LeadNoteDTO = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      leadId,
      userId,
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leadNotes.push(item);
    this.persist();
    return item;
  }

  async deleteLeadNote(noteId: string): Promise<boolean> {
    const idx = this.leadNotes.findIndex(n => n.id === noteId);
    if (idx === -1) return false;
    this.leadNotes.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Saved Leads ---
  async toggleSaveLead(userId: string, leadId: string, tags: string[] = []): Promise<boolean> {
    const idx = this.savedLeads.findIndex(s => s.userId === userId && s.leadId === leadId);
    if (idx !== -1) {
      this.savedLeads.splice(idx, 1);
      this.persist();
      return false; // unsaved
    } else {
      this.savedLeads.push({
        id: `sv-${Date.now()}`,
        userId,
        leadId,
        tags,
        savedAt: new Date().toISOString(),
      });
      this.persist();
      return true; // saved
    }
  }

  async getSavedLeads(userId: string): Promise<BusinessLeadDTO[]> {
    const savedIds = new Set(this.savedLeads.filter(s => s.userId === userId).map(s => s.leadId));
    return this.leads.filter(l => savedIds.has(l.id));
  }

  // --- API Settings & Usage ---
  async getProviderConfigs(userId: string): Promise<ProviderConfigRecord[]> {
    return this.providerConfigs.filter(p => p.userId === userId);
  }

  async updateProviderConfig(
    userId: string,
    providerName: string,
    data: Partial<ProviderConfigRecord>
  ): Promise<ProviderConfigRecord> {
    let cfg = this.providerConfigs.find(p => p.userId === userId && p.providerName === providerName);
    if (!cfg) {
      cfg = {
        id: `pcfg-${Date.now()}`,
        userId,
        providerName,
        isEnabled: true,
        testStatus: 'PENDING',
        updatedAt: new Date().toISOString(),
      };
      this.providerConfigs.push(cfg);
    }
    Object.assign(cfg, data, { updatedAt: new Date().toISOString() });
    this.persist();
    return cfg;
  }

  async recordAPIUsage(data: Omit<APIUsageRecord, 'id' | 'createdAt'>): Promise<APIUsageRecord> {
    const usage: APIUsageRecord = {
      ...data,
      id: `use-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.apiUsages.push(usage);
    this.persist();
    return usage;
  }

  async getAPIUsageStats(userId: string) {
    const records = this.apiUsages.filter(u => u.userId === userId);
    const totalRequests = records.length;
    const totalTokens = records.reduce((acc, r) => acc + (r.tokensUsed || 0), 0);
    const totalEstimatedCost = records.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);

    const byProvider: Record<string, { requests: number; cost: number; tokens: number }> = {};
    for (const r of records) {
      if (!byProvider[r.provider]) {
        byProvider[r.provider] = { requests: 0, cost: 0, tokens: 0 };
      }
      byProvider[r.provider].requests++;
      byProvider[r.provider].cost += r.estimatedCost || 0;
      byProvider[r.provider].tokens += r.tokensUsed || 0;
    }

    return {
      totalRequests,
      totalTokens,
      totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(4)),
      byProvider,
      recentLogs: records.slice(-25).reverse(),
    };
  }

  // --- Audit Logs ---
  async createAuditLog(data: Omit<AuditLogRecord, 'id' | 'createdAt'>): Promise<AuditLogRecord> {
    const log: AuditLogRecord = {
      ...data,
      id: `audit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.persist();
    return log;
  }

  async getAuditLogs(userId?: string): Promise<AuditLogRecord[]> {
    if (userId) return this.auditLogs.filter(a => a.userId === userId).slice(0, 50);
    return this.auditLogs.slice(0, 50);
  }

  // --- Main Dashboard Statistics ---
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const userLeads = this.leads.filter(l => l.userId === userId);
    const userProjects = this.projects.filter(p => p.userId === userId);
    const userUsages = this.apiUsages.filter(u => u.userId === userId);

    const totalLeads = userLeads.length;
    const leadsDiscovered = userLeads.length;
    const emailsFound = userLeads.filter(l => Boolean(l.email)).length;
    const verifiedEmails = userLeads.filter(l => l.emailStatus === 'VERIFIED').length;
    const phonesFound = userLeads.filter(l => Boolean(l.phone)).length;
    const totalSearchProjects = userProjects.length;
    const activeSearches = this.jobs.filter(j => j.status === 'PROCESSING').length;
    const estimatedApiCosts = parseFloat(userUsages.reduce((sum, u) => sum + (u.estimatedCost || 0), 0).toFixed(4));

    const scoreDistribution = {
      excellent: userLeads.filter(l => l.leadScore >= 80).length,
      good: userLeads.filter(l => l.leadScore >= 60 && l.leadScore < 80).length,
      average: userLeads.filter(l => l.leadScore >= 40 && l.leadScore < 60).length,
      low: userLeads.filter(l => l.leadScore < 40).length,
    };

    // Aggregate by Industry
    const indMap = new Map<string, number>();
    for (const lead of userLeads) {
      const ind = lead.industry || 'General';
      indMap.set(ind, (indMap.get(ind) || 0) + 1);
    }
    const leadsByIndustry = Array.from(indMap.entries()).map(([industry, count]) => ({ industry, count }));

    // Aggregate by Country
    const countryMap = new Map<string, number>();
    for (const lead of userLeads) {
      const c = lead.country || 'Unknown';
      countryMap.set(c, (countryMap.get(c) || 0) + 1);
    }
    const leadsByCountry = Array.from(countryMap.entries()).map(([country, count]) => ({ country, count }));

    // Recent activity
    const recentActivity = this.auditLogs
      .filter(a => !userId || a.userId === userId)
      .slice(0, 8)
      .map(a => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        details: a.details || null,
        createdAt: a.createdAt,
      }));

    return {
      totalLeads,
      leadsDiscovered,
      emailsFound,
      verifiedEmails,
      phonesFound,
      totalSearchProjects,
      activeSearches,
      estimatedApiCosts,
      scoreDistribution,
      leadsByIndustry,
      leadsByCountry,
      recentActivity,
    };
  }
}

export const db = new DatabaseService();
