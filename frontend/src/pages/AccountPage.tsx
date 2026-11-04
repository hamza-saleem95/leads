import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore.js';
import { api } from '../services/api.js';
import { Settings, Shield, User, Lock, Activity, CheckCircle2 } from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Account & Compliance Settings
        </h2>
        <p className="text-xs text-slate-400">
          User profile details, role permissions, and platform compliance parameters.
        </p>
      </div>

      {/* User Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-600/20">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{user?.name || 'Executive Director'}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.email || 'admin@aileadfinder.io'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Compliance & Data Governance Guidelines */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          Platform Compliance & Privacy Guardrails
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">Robots.txt Adherence</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Every website crawl dynamically verifies robots.txt disallow rules. Crawlers immediately abort if
              disallowed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">Public Business Data Only</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Only publicly listed corporate emails, contact page phone numbers, and physical offices are indexed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">Throttling & Concurrency</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Background workers respect host concurrency limits, random backoff intervals, and timeout thresholds.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">Data Isolation</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All lead queries, saved prospects, and API secret credentials are partitioned strictly by user ID.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          Security Audit Trail
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1526] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {logs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-white">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-400">{log.entity}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono truncate max-w-xs">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
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
