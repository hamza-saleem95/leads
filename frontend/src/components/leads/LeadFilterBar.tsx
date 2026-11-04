import React from 'react';
import { Search, Download, Filter, RotateCcw, FileSpreadsheet, FileText } from 'lucide-react';
import { LeadStatus, EmailStatus } from '../../types/index.js';
import { api } from '../../services/api.js';

interface LeadFilterBarProps {
  filters: {
    query: string;
    industry: string;
    country: string;
    minScore: number;
    emailStatus: string;
    leadStatus: string;
  };
  onFilterChange: (field: string, value: any) => void;
  onReset: () => void;
  totalResults: number;
}

export const LeadFilterBar: React.FC<LeadFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalResults,
}) => {
  const handleExportCSV = () => {
    const url = api.getCSVExportUrl(filters);
    window.open(url, '_blank');
  };

  const handleExportExcel = () => {
    const url = api.getExcelExportUrl(filters);
    window.open(url, '_blank');
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Top row: search & export buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange('query', e.target.value)}
            placeholder="Search company name, website, email, phone, or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Row: dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Industry
          </label>
          <input
            type="text"
            value={filters.industry}
            onChange={(e) => onFilterChange('industry', e.target.value)}
            placeholder="All Industries"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Country
          </label>
          <input
            type="text"
            value={filters.country}
            onChange={(e) => onFilterChange('country', e.target.value)}
            placeholder="All Countries"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Min Score ({filters.minScore})
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.minScore}
            onChange={(e) => onFilterChange('minScore', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Email Status
          </label>
          <select
            value={filters.emailStatus}
            onChange={(e) => onFilterChange('emailStatus', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="INVALID">Invalid</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Lead Status
          </label>
          <select
            value={filters.leadStatus}
            onChange={(e) => onFilterChange('leadStatus', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="">All Stages</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};
