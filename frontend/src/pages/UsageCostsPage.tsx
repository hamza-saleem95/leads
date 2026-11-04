import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { APIUsageStats } from '../types/index.js';
import { Coins, Zap, Layers, Activity, FileSpreadsheet } from 'lucide-react';

export const UsageCostsPage: React.FC = () => {
  const [usage, setUsage] = useState<APIUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsage();
      setUsage(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !usage) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Coins className="w-5 h-5 text-emerald-400" />
          Usage & Cost Analytics
        </h2>
        <p className="text-xs text-slate-400">
          Real-time metrics on OpenAI token consumption, search provider requests, and estimated infrastructure costs.
        </p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Operations</span>
          <div className="text-2xl font-black text-white">{usage.totalRequests} API Calls</div>
          <span className="text-[11px] text-slate-400">Recorded across all background jobs</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OpenAI Tokens Consumed</span>
          <div className="text-2xl font-black text-indigo-400">{usage.totalTokens.toLocaleString()} Tokens</div>
          <span className="text-[11px] text-slate-400">Model: GPT-4o-mini structured parser</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Cost</span>
          <div className="text-2xl font-black text-emerald-400">${usage.totalEstimatedCost.toFixed(4)}</div>
          <span className="text-[11px] text-slate-400">Direct provider query billing estimate</span>
        </div>
      </div>

      {/* Breakdown By Provider Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Provider Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1526] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Requests</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4 text-right">Estimated Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {Object.entries(usage.byProvider).map(([provider, stats]) => (
                <tr key={provider} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white uppercase font-mono">{provider}</td>
                  <td className="py-3 px-4 text-slate-200">{stats.requests}</td>
                  <td className="py-3 px-4 text-slate-400">{stats.tokens > 0 ? stats.tokens.toLocaleString() : '—'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ${stats.cost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent API Call Logs */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          Recent API Requests
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1526] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usage.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white uppercase font-mono text-[11px]">{log.provider}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{log.endpoint}</td>
                  <td className="py-3 px-4 text-slate-400">{log.tokensUsed || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">
                    ${log.estimatedCost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
