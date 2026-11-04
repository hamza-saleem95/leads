import React from 'react';
import { SearchStrategy } from '../../types/index.js';
import { Sparkles, Play, ShieldAlert, CheckCircle, Database, Search, Layers } from 'lucide-react';

interface StrategyCardProps {
  strategy: SearchStrategy;
  onApprove: () => void;
  onModify: () => void;
  isLaunching?: boolean;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  onApprove,
  onModify,
  isLaunching = false,
}) => {
  return (
    <div className="bg-[#111827] border border-indigo-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6 animate-fade-in">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">AI Proposed Search Strategy</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Awaiting Approval
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Review parameters, queries, and provider assignments before dispatching background jobs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onModify}
            disabled={isLaunching}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Edit Parameters
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={isLaunching}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLaunching ? (
              <span>Deploying Pipeline...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Approve & Launch Discovery</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Parameter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Industry</span>
          <span className="text-sm font-bold text-white mt-0.5 block truncate">{strategy.industry}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Country & Cities</span>
          <span className="text-sm font-bold text-white mt-0.5 block truncate">
            {strategy.cities?.join(', ') || strategy.country} ({strategy.country})
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Quantity</span>
          <span className="text-sm font-bold text-indigo-400 mt-0.5 block">{strategy.quantity} Leads</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Type</span>
          <span className="text-sm font-bold text-white mt-0.5 block truncate">{strategy.businessType || 'B2B Commercial'}</span>
        </div>
      </div>

      {/* Required Contact Fields */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Required Attributes & Validation
        </span>
        <div className="flex flex-wrap gap-2">
          {strategy.requiredFields?.map((field) => (
            <span
              key={field}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
            >
              <CheckCircle className="w-3 h-3 text-indigo-400" />
              {field.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Targeted Multi-Source Search Queries */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Formulated Multi-Provider Search Queries ({strategy.searchQueries?.length || 0})
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {strategy.searchQueries?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-200 font-mono text-[11px] truncate">"{item.query}"</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-sky-400 border border-slate-700 uppercase shrink-0">
                {item.provider}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Strategy Rationale */}
      <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
        <span className="font-bold text-white mr-1.5">Strategic Rationale:</span>
        {strategy.rationale}
      </div>
    </div>
  );
};
