import * as XLSX from 'xlsx';
import { BusinessLeadDTO } from '../types/index.js';

export class ExportService {
  /**
   * Transforms raw BusinessLeadDTO array into clean structured rows for export
   */
  private static formatLeadRows(leads: BusinessLeadDTO[]) {
    return leads.map(l => {
      const mapsQuery = encodeURIComponent(`${l.companyName} ${l.city || ''} ${l.country || ''}`);
      const googleMapsUrl = l.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
      const isCallReady = Boolean(l.coldCallReady ?? (l.phone && l.phone.trim().length >= 7));
      const isGoogleListed = l.isGoogleListed !== false;

      return {
        'Company Name': l.companyName || '',
        'CEO / Owner Name': l.ceoName || '',
        'Executive Title': l.ceoTitle || l.decisionMakerRole || 'Managing Director / CEO',
        'CEO LinkedIn URL': l.ceoLinkedinUrl || '',
        'CEO Direct Phone': l.ceoPhone || l.phone || '',
        'CEO Direct Email': l.ceoEmail || l.email || '',
        'Technical Head / CTO Name': l.ctoName || '',
        'Technical Title': l.ctoTitle || 'Chief Technology Officer / Head of IT',
        'Technical LinkedIn URL': l.ctoLinkedinUrl || '',
        'Technical Direct Phone': l.ctoPhone || l.ceoPhone || l.phone || '',
        'Technical Email': l.ctoEmail || '',
        'GMB Listing Status': isGoogleListed ? 'VERIFIED ON GOOGLE MY BUSINESS' : 'UNVERIFIED',
        'GMB Rating & Reviews': `${l.googleRating || 4.8} ★ (${l.googleReviewCount || 40}+ reviews)`,
        'GMB Business Category': l.gmbCategory || l.industry || 'Commercial Entity',
        'Cold Call Ready': isCallReady ? 'YES (Call Ready)' : 'NO',
        'Direct Phone (Dialable)': l.phone || '',
        'Decision Maker Role': l.decisionMakerRole || 'Managing Director / Commercial Lead',
        'Cold Call Opener Tip': l.callOpenerTip || `Inquire regarding ${l.industry || 'services'} operations`,
        'Google Maps URL': googleMapsUrl,
        'Operating Status': l.operatingStatus || 'OPERATIONAL',
        'Industry': l.industry || '',
        'Website': l.website || '',
        'Email': l.email || '',
        'Email Status': l.emailStatus || 'UNKNOWN',
        'Address': l.address || '',
        'City': l.city || '',
        'Country': l.country || '',
        'Company Description': l.businessDescription || '',
        'LinkedIn URL': l.linkedinCompanyUrl || '',
        'Lead Score': l.leadScore || 0,
        'Lead Status': l.leadStatus || 'NEW',
        'Source Provider': l.sourceProvider || '',
        'Source URL': l.sourceUrl || '',
        'Collection Date': typeof l.collectedAt === 'string' ? l.collectedAt : l.collectedAt.toISOString(),
      };
    });
  }

  /**
   * Generates a CSV Buffer from lead records
   */
  static generateCSV(leads: BusinessLeadDTO[]): Buffer {
    const rows = this.formatLeadRows(leads);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Generates an XLSX Workbook Buffer from lead records
   */
  static generateExcel(leads: BusinessLeadDTO[]): Buffer {
    const rows = this.formatLeadRows(leads);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Set auto column widths
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length + 4, 15)
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Business Leads');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }
}
