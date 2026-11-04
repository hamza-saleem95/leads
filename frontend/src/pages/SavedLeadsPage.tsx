import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { BusinessLead } from '../types/index.js';
import { LeadsTable } from '../components/leads/LeadsTable.js';
import { LeadDetailModal } from '../components/leads/LeadDetailModal.js';
import { BookmarkCheck, FileSpreadsheet, FileText } from 'lucide-react';

export const SavedLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [activeLead, setActiveLead] = useState<BusinessLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSavedLeads();
      setLeads(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async (id: string) => {
    try {
      await api.toggleSave(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-amber-400" />
            Starred & Saved Leads ({leads.length})
          </h2>
          <p className="text-xs text-slate-400">
            Priority leads flagged by your team for immediate sales outreach and follow-up.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/leads/export/csv"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/leads/export/xlsx"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
          <BookmarkCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Saved Leads Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click the bookmark icon next to any company in All Leads to pin it to your saved workspace.
          </p>
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          selectedIds={[]}
          onToggleSelect={() => {}}
          onSelectAll={() => {}}
          onLeadClick={(lead) => {
            setActiveLead(lead);
            setIsDetailOpen(true);
          }}
          onToggleSave={handleToggleSave}
          savedLeadIds={new Set(leads.map((l) => l.id))}
          onSort={() => {}}
          sortBy="leadScore"
          sortOrder="desc"
          pagination={{ page: 1, limit: leads.length, total: leads.length, totalPages: 1 }}
          onPageChange={() => {}}
          onBulkStatus={() => {}}
          onBulkDelete={() => {}}
        />
      )}

      <LeadDetailModal
        lead={activeLead}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onLeadUpdated={(updated) => {
          setActiveLead(updated);
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        }}
        onLeadDeleted={(id) => {
          setLeads((prev) => prev.filter((l) => l.id !== id));
        }}
      />
    </div>
  );
};
