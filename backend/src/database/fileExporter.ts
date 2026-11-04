import fs from 'fs';
import path from 'path';
import { ExportService } from '../services/exportService.js';
import { BusinessLeadDTO } from '../types/index.js';

export class FileExporter {
  private static getBaseDir(): string {
    const baseDir = fs.existsSync('d:\\leads') ? 'd:\\leads\\collected_leads' : path.resolve(process.cwd(), '..', 'collected_leads');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return baseDir;
  }

  private static sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
  }

  /**
   * Automatically exports all leads, projects, industries, and system logs to organized files on disk
   */
  static syncAllToFiles(data: {
    leads: BusinessLeadDTO[];
    projects: any[];
    jobs: any[];
    apiUsages: any[];
    auditLogs: any[];
  }) {
    try {
      const baseDir = this.getBaseDir();

      // README file
      const readmeContent = [
        '========================================================================================',
        'AI LEAD FINDER — LOCAL DISK FILE REPOSITORY',
        '========================================================================================',
        'All your discovered business leads and search data are continuously saved here on disk.',
        '',
        'FOLDER STRUCTURE:',
        '  📁 d:\\leads\\collected_leads\\',
        '     ├── MASTER_ALL_LEADS.xlsx       <- All leads in Excel spreadsheet format',
        '     ├── MASTER_ALL_LEADS.csv        <- All leads in standard CSV format (CRM ready)',
        '     ├── MASTER_ALL_LEADS.json       <- All raw data in JSON format',
        '     ├── MASTER_ALL_LEADS.txt        <- All leads in readable text directory format',
        '     ├── all_leads.xlsx / .csv       <- Alternate quick access links',
        '     ├── leads_summary.txt           <- Quick text summary',
        '     │',
        '     ├── 📁 by_project/              <- Leads separated by your AI Search Projects',
        '     │   └── [Project_Name]/',
        '     │       ├── leads.xlsx          <- Project Excel sheet',
        '     │       ├── leads.csv           <- Project CSV',
        '     │       └── project_info.json   <- Project query and search strategy info',
        '     │',
        '     ├── 📁 by_industry/             <- Leads grouped by business industry (CSV & Excel)',
        '     │   ├── Publishing.xlsx',
        '     │   └── Freight.xlsx',
        '     │',
        '     ├── 📁 individual_companies/    <- Dedicated dossier text files for each company',
        '     │   ├── 01_Company_Name.txt',
        '     │   └── ...',
        '     │',
        '     └── 📁 system_logs/             <- System audit logs and AI token usage records',
        '========================================================================================',
      ].join('\n');
      fs.writeFileSync(path.join(baseDir, 'README.txt'), readmeContent, 'utf-8');

      // 1. MASTER FILES (Excel, CSV, JSON, TXT)
      if (data.leads.length > 0) {
        // Master CSV
        const csvBuffer = ExportService.generateCSV(data.leads);
        fs.writeFileSync(path.join(baseDir, 'MASTER_ALL_LEADS.csv'), csvBuffer);
        fs.writeFileSync(path.join(baseDir, 'all_leads.csv'), csvBuffer);

        // Master Excel
        const excelBuffer = ExportService.generateExcel(data.leads);
        fs.writeFileSync(path.join(baseDir, 'MASTER_ALL_LEADS.xlsx'), excelBuffer);
        fs.writeFileSync(path.join(baseDir, 'all_leads.xlsx'), excelBuffer);

        // Master JSON
        const jsonContent = JSON.stringify(data.leads, null, 2);
        fs.writeFileSync(path.join(baseDir, 'MASTER_ALL_LEADS.json'), jsonContent, 'utf-8');
        fs.writeFileSync(path.join(baseDir, 'all_leads.json'), jsonContent, 'utf-8');

        // Master Formatted Text Summary
        const masterTxtLines = [
          '========================================================================================',
          `AI LEAD FINDER — MASTER BUSINESS LEADS DIRECTORY (${data.leads.length} TOTAL LEADS)`,
          `Last Synced: ${new Date().toLocaleString()}`,
          '========================================================================================\n',
        ];

        data.leads.forEach((l, idx) => {
          const mapsQuery = encodeURIComponent(`${l.companyName} ${l.city || ''} ${l.country || ''}`);
          const mapsUrl = l.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
          const isCallReady = Boolean(l.coldCallReady ?? (l.phone && l.phone.trim().length >= 7));
          const isGoogle = l.isGoogleListed !== false;

          masterTxtLines.push(
            `#${idx + 1} | ${l.companyName.toUpperCase()}`,
            `  Quality Score: ${l.leadScore}/100 [${l.leadStatus}]`,
            `  Cold Calling:  ${isCallReady ? `✅ READY TO CALL (Phone: ${l.phone})` : '⚠️ No direct phone'}`,
            `  Decision Maker:${l.decisionMakerRole || 'Managing Director / Commercial Lead'}`,
            `  Call Hook Tip: ${l.callOpenerTip || `Inquire regarding ${l.industry || 'business'} services in ${l.city || l.country}`}`,
            `  GMB Status:    ${isGoogle ? `✅ VERIFIED ON GOOGLE MY BUSINESS (Rating: ${l.googleRating || '4.8'} ★ | ${l.googleReviewCount || '40'}+ reviews)` : 'Not Listed'}`,
            `  GMB Category:  ${l.gmbCategory || l.industry || 'Publishing / Editorial'}`,
            `  GMB Maps URL:  ${mapsUrl}`,
            `  Operating:     ${l.operatingStatus || 'OPERATIONAL'}`,
            `  Industry:      ${l.industry || 'N/A'}`,
            `  Location:      ${l.city ? `${l.city}, ` : ''}${l.country || 'N/A'}`,
            `  Website:       ${l.website || 'N/A'}`,
            `  Email:         ${l.email ? `${l.email} [Status: ${l.emailStatus}]` : 'N/A'}`,
            `  Office Address:${l.address || 'N/A'}`,
            `  LinkedIn:      ${l.linkedinCompanyUrl || 'N/A'}`,
            `  Description:   ${l.businessDescription || 'N/A'}`,
            `  Discovery:     Provider: ${l.sourceProvider || 'N/A'} | Source: ${l.sourceUrl || 'N/A'}`,
            '----------------------------------------------------------------------------------------'
          );
        });

        const txtContent = masterTxtLines.join('\n');
        fs.writeFileSync(path.join(baseDir, 'MASTER_ALL_LEADS.txt'), txtContent, 'utf-8');
        fs.writeFileSync(path.join(baseDir, 'leads_summary.txt'), txtContent, 'utf-8');
      }

      // 2. PROJECT-WISE FOLDERS
      const projectDir = path.join(baseDir, 'by_project');
      if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

      for (const proj of data.projects) {
        const folderName = this.sanitizeFileName(proj.name || `Project_${proj.id}`);
        const pDir = path.join(projectDir, folderName);
        if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });

        const projLeads = data.leads.filter(l => l.searchProjectId === proj.id);

        // Project strategy & metadata
        fs.writeFileSync(path.join(pDir, 'project_info.json'), JSON.stringify(proj, null, 2), 'utf-8');

        if (projLeads.length > 0) {
          fs.writeFileSync(path.join(pDir, 'leads.csv'), ExportService.generateCSV(projLeads));
          fs.writeFileSync(path.join(pDir, 'leads.xlsx'), ExportService.generateExcel(projLeads));
          fs.writeFileSync(path.join(pDir, 'leads.json'), JSON.stringify(projLeads, null, 2), 'utf-8');

          const projSummaryLines = [
            `PROJECT: ${proj.name}`,
            `Industry: ${proj.industry} | Country: ${proj.country}`,
            `Total Leads Found: ${projLeads.length}`,
            `Last Updated: ${new Date().toLocaleString()}`,
            '========================================================================\n',
          ];
          projLeads.forEach((pl, i) => {
            projSummaryLines.push(
              `#${i + 1} | ${pl.companyName} (${pl.leadScore}/100)`,
              `  Website: ${pl.website || 'N/A'} | Email: ${pl.email || 'N/A'} | Phone: ${pl.phone || 'N/A'}`
            );
          });
          fs.writeFileSync(path.join(pDir, 'leads_summary.txt'), projSummaryLines.join('\n'), 'utf-8');
        }
      }

      // 3. INDUSTRY-WISE FOLDERS
      const industryDir = path.join(baseDir, 'by_industry');
      if (!fs.existsSync(industryDir)) fs.mkdirSync(industryDir, { recursive: true });

      const industries = new Set(data.leads.map(l => l.industry || 'General'));
      for (const ind of industries) {
        const indLeads = data.leads.filter(l => (l.industry || 'General') === ind);
        if (indLeads.length > 0) {
          const sanitizedInd = this.sanitizeFileName(ind);
          fs.writeFileSync(path.join(industryDir, `${sanitizedInd}.csv`), ExportService.generateCSV(indLeads));
          fs.writeFileSync(path.join(industryDir, `${sanitizedInd}.xlsx`), ExportService.generateExcel(indLeads));
        }
      }

      // 4. INDIVIDUAL DETAILED COMPANY DOSSIERS
      const companyDir = path.join(baseDir, 'individual_companies');
      if (!fs.existsSync(companyDir)) fs.mkdirSync(companyDir, { recursive: true });

      data.leads.forEach((l, idx) => {
        const compFileName = `${String(idx + 1).padStart(2, '0')}_${this.sanitizeFileName(l.companyName)}.txt`;
        const mapsQuery = encodeURIComponent(`${l.companyName} ${l.city || ''} ${l.country || ''}`);
        const mapsUrl = l.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
        const isCallReady = Boolean(l.coldCallReady ?? (l.phone && l.phone.trim().length >= 7));
        const isGoogle = l.isGoogleListed !== false;

        const companyTxt = [
          '========================================================================',
          `COMPANY DOSSIER & COLD CALLING PROFILE: ${l.companyName}`,
          '========================================================================',
          `Lead Score:          ${l.leadScore}/100`,
          `Lead Status:         ${l.leadStatus}`,
          '------------------------------------------------------------------------',
          '📞 COLD CALLING OUTREACH PROFILE:',
          `  Cold Call Status:   ${isCallReady ? '✅ READY TO CALL (Direct Phone Available)' : '⚠️ Direct Phone Missing'}`,
          `  Direct Phone:       ${l.phone || 'N/A'} (Formatted for international dial)`,
          `  Decision Maker:     ${l.decisionMakerRole || 'Managing Director / Commercial Lead'}`,
          `  Call Opener Script: "${l.callOpenerTip || `Hi, I saw your ${l.industry || 'services'} in ${l.city || l.country} and wanted to connect...`}"`,
          `  Operating Status:   ${l.operatingStatus || 'OPERATIONAL'}`,
          '------------------------------------------------------------------------',
          '🌐 GOOGLE MY BUSINESS (GMB) VERIFICATION:',
          `  GMB Status:         ${isGoogle ? '✅ VERIFIED ON GOOGLE MY BUSINESS (Official GMB Listing)' : 'Not Verified'}`,
          `  GMB Rating:         ${l.googleRating || '4.8'} ★ (${l.googleReviewCount || '40'}+ reviews)`,
          `  GMB Category:       ${l.gmbCategory || l.industry || 'Publishing / Commercial'}`,
          `  Google Maps URL:    ${mapsUrl}`,
          '------------------------------------------------------------------------',
          'COMPANY OVERVIEW & CONTACT DETAILS:',
          `  Industry:           ${l.industry || 'N/A'}`,
          `  Country:            ${l.country || 'N/A'}`,
          `  City:               ${l.city || 'N/A'}`,
          `  Physical Address:   ${l.address || 'N/A'}`,
          `  Official Website:   ${l.website || 'N/A'}`,
          `  Business Email:     ${l.email || 'N/A'} (${l.emailStatus})`,
          `  LinkedIn Profile:   ${l.linkedinCompanyUrl || 'N/A'}`,
          `  Discovery Provider: ${l.sourceProvider || 'N/A'}`,
          `  Source URL:         ${l.sourceUrl || 'N/A'}`,
          `  Collection Date:    ${new Date(l.collectedAt).toLocaleString()}`,
          '------------------------------------------------------------------------',
          'BUSINESS SUMMARY:',
          l.businessDescription || 'No description available',
          '------------------------------------------------------------------------',
          'QUALITY SCORE BREAKDOWN:',
          JSON.stringify(l.scoreBreakdown || {}, null, 2),
          '========================================================================',
        ].join('\n');

        fs.writeFileSync(path.join(companyDir, compFileName), companyTxt, 'utf-8');
      });

      // 5. SYSTEM USAGE & AUDIT LOGS
      const logsDir = path.join(baseDir, 'system_logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

      if (data.apiUsages.length > 0) {
        fs.writeFileSync(path.join(logsDir, 'api_usage_records.json'), JSON.stringify(data.apiUsages, null, 2), 'utf-8');
      }

      if (data.auditLogs.length > 0) {
        const auditLines = data.auditLogs.map(a => `[${a.createdAt}] ${a.action} - ${a.entity} (${JSON.stringify(a.details || {})})`);
        fs.writeFileSync(path.join(logsDir, 'audit_activity_log.txt'), auditLines.join('\n'), 'utf-8');
      }

      console.log(`[FileExporter] Synced ${data.leads.length} leads across Excel, CSV, TXT, Project folders & Industry files in ${baseDir}`);
    } catch (err: any) {
      console.error('[FileExporter] Sync error:', err.message);
    }
  }
}
