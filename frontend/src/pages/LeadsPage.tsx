import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { BusinessLead, LeadStatus } from '../types/index.js';
import { LeadFilterBar } from '../components/leads/LeadFilterBar.js';
import { LeadsTable } from '../components/leads/LeadsTable.js';
import { LeadDetailModal } from '../components/leads/LeadDetailModal.js';
import { Users, Sparkles, FolderOpen, RefreshCw } from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedLeadIds, setSavedLeadIds] = useState<Set<string>>(new Set());
  const [activeLead, setActiveLead] = useState<BusinessLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    query: '',
    industry: '',
    country: '',
    minScore: 0,
    emailStatus: '',
    leadStatus: '',
  });

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('leadScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    fetchLeads();
    fetchSavedLeads();
  }, [filters, sortBy, sortOrder, pagination.page]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const activeParams: Record<string, any> = {
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.query?.trim()) activeParams.query = filters.query.trim();
      if (filters.industry?.trim()) activeParams.industry = filters.industry.trim();
      if (filters.country?.trim()) activeParams.country = filters.country.trim();
      if (filters.minScore > 0) activeParams.minScore = filters.minScore;
      if (filters.emailStatus) activeParams.emailStatus = filters.emailStatus;
      if (filters.leadStatus) activeParams.leadStatus = filters.leadStatus;

      const res = await api.getLeads(activeParams);

      setLeads(res.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.totalPages || 1,
      }));
    } catch (e: any) {
      console.error('Error fetching leads:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedLeads = async () => {
    try {
      const saved = await api.getSavedLeads();
      setSavedLeadIds(new Set(saved.map((s) => s.id)));
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      industry: '',
      country: '',
      minScore: 0,
      emailStatus: '',
      leadStatus: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  const handleToggleSave = async (id: string) => {
    try {
      const isSaved = await api.toggleSave(id);
      setSavedLeadIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch (e: any) {
      console.error('Failed to toggle save', e);
    }
  };

  const handleBulkStatus = async (status: LeadStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await api.bulkUpdateStatus(selectedIds, status);
      fetchLeads();
      setSelectedIds([]);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected leads?`)) return;
    try {
      await api.bulkDelete(selectedIds);
      fetchLeads();
      setSelectedIds([]);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleLeadClick = (lead: BusinessLead) => {
    setActiveLead(lead);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            All Discovered Business Leads
          </h2>
          <p className="text-xs text-slate-400">
            Deduplicated, scored, and enriched database records ready for CRM export or qualification.
          </p>
        </div>

        <button
          onClick={() => fetchLeads()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Disk Folder Persistence Banner */}
      <div className="bg-[#111827]/90 border border-emerald-500/30 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <span>All Data Auto-Saved To Local Disk Folder</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                Auto-Sync Active
              </span>
            </div>
            <div className="text-slate-400 text-[11px] font-mono mt-0.5">
              Folder: <span className="text-emerald-300 font-semibold select-all">d:\leads\collected_leads\</span> (Excel .xlsx, CSV, TXT Dossiers, Project & Industry Folders)
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <LeadFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={pagination.total}
      />

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onLeadClick={handleLeadClick}
          onToggleSave={handleToggleSave}
          savedLeadIds={savedLeadIds}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onBulkStatus={handleBulkStatus}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Lead Detail Modal */}
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
