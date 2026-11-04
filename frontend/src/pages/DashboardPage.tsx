import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { DashboardStats } from '../types/index.js';
import {
  Users,
  Search,
  Mail,
  CheckCircle2,
  Phone,
  FolderGit2,
  Flame,
  Coins,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e: any) {
      console.error('Failed to load dashboard statistics', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Aggregating live platform metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Discovery Engine v2.0 Ready</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            Discover, Validate & Score High-Value B2B Prospects
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Multi-source search across Google Places, Tavily, SerpAPI, and Bing with automated robots.txt compliant
            website extraction, corporate email verification, and quality scoring.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/search"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch AI Search Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/leads"
              className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Inspect Database ({stats.totalLeads} Leads)
            </Link>
          </div>
        </div>
      </div>

      {/* 8 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', val: stats.totalLeads, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Leads Discovered', val: stats.leadsDiscovered, icon: Search, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { label: 'Emails Found', val: stats.emailsFound, icon: Mail, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Verified Emails', val: stats.verifiedEmails, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Phone Numbers', val: stats.phonesFound, icon: Phone, color: 'text-teal-400', bg: 'bg-teal-500/10' },
          { label: 'Search Projects', val: stats.totalSearchProjects, icon: FolderGit2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Active Searches', val: stats.activeSearches, icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Estimated API Cost', val: `$${stats.estimatedApiCosts.toFixed(4)}`, icon: Coins, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                <div className="text-2xl font-black text-white">{m.val}</div>
              </div>
              <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Grid: Quality Score Distribution & Industry Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Quality Distribution */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Lead Quality Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Total: {stats.totalLeads}</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Tier 1: Highly Qualified (80-100)', count: stats.scoreDistribution.excellent, bar: 'bg-emerald-500', text: 'text-emerald-400' },
              { label: 'Tier 2: Strong Match (60-79)', count: stats.scoreDistribution.good, bar: 'bg-indigo-500', text: 'text-indigo-400' },
              { label: 'Tier 3: Moderate (40-59)', count: stats.scoreDistribution.average, bar: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'Tier 4: Incomplete / Low (<40)', count: stats.scoreDistribution.low, bar: 'bg-rose-500', text: 'text-rose-400' },
            ].map((tier) => {
              const pct = stats.totalLeads > 0 ? Math.round((tier.count / stats.totalLeads) * 100) : 0;
              return (
                <div key={tier.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{tier.label}</span>
                    <span className={`font-bold ${tier.text}`}>
                      {tier.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${tier.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads by Industry */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Top Industries
            </h3>
            <span className="text-[11px] text-slate-400">Database Breakdown</span>
          </div>

          <div className="space-y-3 pt-2">
            {stats.leadsByIndustry.length === 0 ? (
              <span className="text-xs text-slate-400">No industry data yet</span>
            ) : (
              stats.leadsByIndustry.slice(0, 5).map((item) => {
                const pct = stats.totalLeads > 0 ? Math.round((item.count / stats.totalLeads) * 100) : 0;
                return (
                  <div key={item.industry} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 truncate">{item.industry}</span>
                      <span className="font-bold text-slate-400">{item.count} leads</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Audit & Discovery Activity */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Recent Operations
            </h3>
            <span className="text-[11px] text-slate-400">Live Audit Trail</span>
          </div>

          <div className="space-y-2.5 pt-1 overflow-y-auto max-h-56 pr-1">
            {stats.recentActivity.length === 0 ? (
              <span className="text-xs text-slate-400">No recent operations logged</span>
            ) : (
              stats.recentActivity.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                    {log.entity} {log.details ? `• ${JSON.stringify(log.details)}` : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
