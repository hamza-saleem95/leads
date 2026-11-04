import { describe, it, expect } from 'vitest';
import { DataNormalizer } from '../src/processors/normalizer.js';
import { DeduplicationEngine } from '../src/processors/deduplicator.js';
import { LeadScoringEngine } from '../src/scoring/leadScorer.js';
import { ExportService } from '../src/services/exportService.js';
import { BusinessLeadDTO } from '../src/types/index.js';

describe('Data Normalizer', () => {
  it('normalizes domains accurately', () => {
    expect(DataNormalizer.normalizeDomain('https://www.example.co.uk/about?ref=123')).toBe('example.co.uk');
    expect(DataNormalizer.normalizeDomain('http://subdomain.test.com:8080/')).toBe('subdomain.test.com');
  });

  it('normalizes company names by stripping corporate suffixes', () => {
    expect(DataNormalizer.normalizeCompanyName('Apex Global Solutions, Inc.')).toBe('apex global solutions');
    expect(DataNormalizer.normalizeCompanyName('Vanguard Cargo Line Ltd.')).toBe('vanguard cargo line');
    expect(DataNormalizer.normalizeCompanyName('Meridian Freight LLC')).toBe('meridian freight');
  });

  it('normalizes phone numbers to standard digit strings', () => {
    expect(DataNormalizer.normalizePhone('+44 (0) 20 7946 0921')).toBe('+4402079460921');
    expect(DataNormalizer.normalizePhone('(800) 555-0199')).toBe('8005550199');
  });
});

describe('Deduplication Engine', () => {
  const existingLead: BusinessLeadDTO = {
    id: 'lead-test-1',
    userId: 'u1',
    companyName: 'Apex Ocean Logistics Ltd',
    website: 'https://www.apexoceanlogistics.co.uk',
    email: 'ops@apexoceanlogistics.co.uk',
    emailStatus: 'VERIFIED',
    phone: '+44 20 7946 0921',
    address: '14 St Katharine Docks, London',
    city: 'London',
    country: 'United Kingdom',
    leadScore: 90,
    leadStatus: 'NEW',
    extractionStatus: 'COMPLETED',
    collectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('detects duplicate by exact domain match', () => {
    const candidate = {
      companyName: 'Apex Ocean Logistics',
      website: 'http://apexoceanlogistics.co.uk/contact',
    };
    const match = DeduplicationEngine.findDuplicate(candidate, [existingLead]);
    expect(match.duplicate).not.toBeNull();
    expect(match.matchReason).toBe('DOMAIN_MATCH');
  });

  it('detects duplicate by name similarity and location', () => {
    const candidate = {
      companyName: 'Apex Ocean Logistics Limited',
      city: 'London',
      country: 'United Kingdom',
    };
    const match = DeduplicationEngine.findDuplicate(candidate, [existingLead]);
    expect(match.duplicate).not.toBeNull();
    expect(match.matchReason).toBe('COMPANY_NAME_AND_LOCATION');
  });

  it('merges new non-empty fields without overwriting verified data', () => {
    const candidate: Partial<BusinessLeadDTO> = {
      phone: '+44 20 7946 9999',
      businessDescription: 'Expanded operations overview',
      linkedinCompanyUrl: 'https://linkedin.com/company/apex-ocean',
    };
    const merged = DeduplicationEngine.mergeLeads(existingLead, candidate);
    expect(merged.linkedinCompanyUrl).toBe('https://linkedin.com/company/apex-ocean');
    expect(merged.businessDescription).toBe('Expanded operations overview');
    expect(merged.email).toBe('ops@apexoceanlogistics.co.uk'); // preserved verified email
  });
});

describe('Lead Quality Scoring', () => {
  it('calculates score breakdown up to 100 points', () => {
    const lead: Partial<BusinessLeadDTO> = {
      companyName: 'Apex Ocean Logistics',
      industry: 'Freight Forwarding',
      businessDescription: 'Specialized freight forwarding and air cargo handling in London.',
      website: 'https://www.apexoceanlogistics.co.uk',
      email: 'contact@apexoceanlogistics.co.uk',
      emailStatus: 'VERIFIED',
      phone: '+44 20 7946 0921',
      address: '14 St Katharine Docks, London, United Kingdom',
      city: 'London',
      country: 'United Kingdom',
      linkedinCompanyUrl: 'https://linkedin.com/company/apex',
      sourceProvider: 'tavily',
    };

    const { total, breakdown } = LeadScoringEngine.scoreLead(lead, {
      industry: 'Freight Forwarding',
      country: 'United Kingdom',
      cities: ['London'],
    });

    expect(total).toBeGreaterThanOrEqual(85);
    expect(breakdown.industryRelevance).toBe(30);
    expect(breakdown.locationMatch).toBe(20);
    expect(breakdown.websiteAvailability).toBe(10);
    expect(breakdown.emailAvailability).toBe(15);
    expect(breakdown.phoneAvailability).toBe(10);
  });
});

describe('Export Service', () => {
  it('generates non-empty CSV and XLSX buffers from leads', () => {
    const leads: BusinessLeadDTO[] = [
      {
        id: '1',
        userId: 'u1',
        companyName: 'Acme Logistics',
        industry: 'Freight',
        website: 'https://acme.com',
        email: 'info@acme.com',
        emailStatus: 'VERIFIED',
        phone: '+1 800 555 0100',
        city: 'New York',
        country: 'United States',
        leadScore: 90,
        leadStatus: 'QUALIFIED',
        extractionStatus: 'COMPLETED',
        collectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const csv = ExportService.generateCSV(leads);
    expect(csv.length).toBeGreaterThan(50);
    expect(csv.toString('utf-8')).toContain('Acme Logistics');

    const xlsx = ExportService.generateExcel(leads);
    expect(xlsx.length).toBeGreaterThan(100);
  });
});
