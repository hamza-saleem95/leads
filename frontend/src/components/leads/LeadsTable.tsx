import React from 'react';
import { BusinessLead, LeadStatus } from '../../types/index.js';
import { ScoreIndicator } from '../common/ScoreIndicator.js';
import { StatusPill } from '../common/StatusPill.js';
import {
  Globe,
  Mail,
  Phone,
  Bookmark,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckSquare,
  MapPin,
  Linkedin,
  UserCheck,
} from 'lucide-react';

interface LeadsTableProps {
  leads: BusinessLead[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onLeadClick: (lead: BusinessLead) => void;
  onToggleSave: (id: string) => void;
  savedLeadIds: Set<string>;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
  onBulkStatus: (status: LeadStatus) => void;
  onBulkDelete: () => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onLeadClick,
  onToggleSave,
  savedLeadIds,
  onSort,
  sortBy,
  sortOrder,
  pagination,
  onPageChange,
  onBulkStatus,
  onBulkDelete,
}) => {
  const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Bulk Action Bar (appears when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-950/60 border-b border-indigo-500/30 px-6 py-2.5 flex items-center justify-between animate-fade-in text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>
              <strong className="text-white">{selectedIds.length}</strong> leads selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px]">Set Status:</span>
            {(['REVIEWED', 'QUALIFIED', 'CONTACTED', 'CONVERTED', 'REJECTED'] as LeadStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => onBulkStatus(status)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700"
              >
                {status}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0E1526] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold select-none">
            <tr>
              <th className="py-3.5 pl-6 pr-3 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-3 w-10">Save</th>
              <th
                onClick={() => onSort('companyName')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Company Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-sky-400" />
                  <span>CEO / Owner (LinkedIn)</span>
                </div>
              </th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Contact Details</th>
              <th
                onClick={() => onSort('leadScore')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Score (0-100)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Stage</th>
              <th className="py-3.5 px-4">Provider</th>
              <th className="py-3.5 pr-6 pl-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  No business leads match your filter criteria.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id);
                const isSaved = savedLeadIds.has(lead.id);

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-6 pr-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(lead.id)}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleSave(lead.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-white" onClick={() => onLeadClick(lead)}>
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                          {lead.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                          {lead.industry || 'General B2B'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4" onClick={() => onLeadClick(lead)}>
                      <div className="space-y-2">
                        {/* CEO / Owner */}
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]">{lead.ceoName || lead.decisionMakerRole?.split('(')[0]?.trim() || 'Executive Leadership'}</span>
                            {lead.ceoLinkedinUrl && (
                              <a
                                href={lead.ceoLinkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sky-400 hover:text-sky-300 p-0.5 rounded hover:bg-sky-500/10 transition-colors shrink-0"
                                title="CEO LinkedIn Profile"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                            {lead.ceoTitle || 'CEO / Managing Director'}
                          </div>
                          {(lead.ceoPhone || lead.phone) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <a
                                href={`tel:${lead.ceoPhone || lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-medium transition-colors"
                                title="Direct call to CEO"
                              >
                                <Phone className="w-2.5 h-2.5 text-sky-400" />
                                <span>{lead.ceoPhone || lead.phone}</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Technical Head / CTO */}
                        {lead.ctoName && (
                          <div className="pt-1.5 border-t border-slate-800/80 space-y-0.5">
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px]">
                              <span className="text-indigo-400 text-[9px] font-bold uppercase bg-indigo-500/20 px-1 rounded">TECH</span>
                              <span className="truncate max-w-[120px]">{lead.ctoName}</span>
                              {lead.ctoLinkedinUrl && (
                                <a
                                  href={lead.ctoLinkedinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-indigo-400 hover:text-indigo-300 p-0.5 rounded hover:bg-indigo-500/10 transition-colors shrink-0"
                                  title="CTO / Tech Head LinkedIn Profile"
                                >
                                  <Linkedin className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate max-w-[170px]">
                              {lead.ctoTitle || 'Chief Technology Officer'}
                            </div>
                            {lead.ctoPhone && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <a
                                  href={`tel:${lead.ctoPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-medium transition-colors"
                                  title="Direct call to Technical Head / CTO"
                                >
                                  <Phone className="w-2.5 h-2.5 text-indigo-400" />
                                  <span>{lead.ctoPhone}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4" onClick={() => onLeadClick(lead)}>
                      <div className="text-slate-200">{lead.city || lead.country || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{lead.country}</div>
                    </td>

                    <td className="py-3.5 px-4" onClick={() => onLeadClick(lead)}>
                      <div className="space-y-1.5">
                        {lead.email ? (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px] truncate max-w-[170px]">{lead.email}</span>
                            <StatusPill status={lead.emailStatus} type="email" />
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No email</span>
                        )}

                        {lead.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                              title="Click to dial for cold call"
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="font-mono">{lead.phone}</span>
                              <span className="text-[9px] bg-emerald-500/20 px-1 rounded uppercase font-bold text-emerald-300">Call</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">No phone</span>
                        )}

                        {lead.isGoogleListed !== false && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-400">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <a
                              href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.companyName)}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline flex items-center gap-0.5 font-medium"
                              title="Verified on Google Maps"
                            >
                              <span className="font-semibold text-emerald-400">GMB Verified</span>
                              <span className="text-slate-400">({lead.googleRating || 4.8}★)</span>
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4" onClick={() => onLeadClick(lead)}>
                      <ScoreIndicator score={lead.leadScore} showDetails size="md" />
                    </td>

                    <td className="py-3.5 px-4" onClick={() => onLeadClick(lead)}>
                      <StatusPill status={lead.leadStatus} type="lead" />
                    </td>

                    <td className="py-3.5 px-4" onClick={() => onLeadClick(lead)}>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 uppercase">
                        {lead.sourceProvider || 'MULTI'}
                      </span>
                    </td>

                    <td className="py-3.5 pr-6 pl-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Visit website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => onLeadClick(lead)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/20"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3 border-t border-slate-800 bg-[#0E1526] flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <strong className="text-white">{(pagination.page - 1) * pagination.limit + 1}</strong> to{' '}
          <strong className="text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> of{' '}
          <strong className="text-white">{pagination.total}</strong> leads
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
