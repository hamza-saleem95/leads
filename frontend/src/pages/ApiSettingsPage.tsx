import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ProviderConfig } from '../types/index.js';
import { KeyRound, ShieldAlert, Check, RefreshCw, Eye, EyeOff, Save } from 'lucide-react';

export const ApiSettingsPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [testingName, setTestingName] = useState<string | null>(null);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProviders();
      setProviders(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyChange = (provider: string, val: string) => {
    setKeys((prev) => ({ ...prev, [provider]: val }));
  };

  const handleSave = async (name: string, isEnabled?: boolean) => {
    setSavingName(name);
    try {
      await api.updateProvider(name, {
        apiKey: keys[name],
        isEnabled,
      });
      await loadProviders();
      setKeys((prev) => ({ ...prev, [name]: '' }));
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSavingName(null);
    }
  };

  const handleTest = async (name: string) => {
    setTestingName(name);
    try {
      const res = await api.testProvider(name, keys[name]);
      setTestResults((prev) => ({ ...prev, [name]: res }));
      await loadProviders();
    } catch (e: any) {
      setTestResults((prev) => ({ ...prev, [name]: { status: 'ERROR', message: e.message } }));
    } finally {
      setTestingName(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          API & Discovery Provider Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Securely manage your API keys. Secrets are encrypted on the server and masked in the UI.
        </p>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-800/80">
        {providers.map((p) => {
          const isTesting = testingName === p.name;
          const isSaving = savingName === p.name;
          const testRes = testResults[p.name];

          return (
            <div key={p.name} className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sm text-indigo-400">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{p.displayName}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {p.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      p.testStatus === 'CONNECTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : p.testStatus === 'AWAITING_CREDENTIALS'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {p.testStatus.replace(/_/g, ' ')}
                  </span>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={p.isEnabled}
                      onChange={(e) => handleSave(p.name, e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>

              {/* Masked status / Input */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2 relative">
                  <input
                    type="password"
                    value={keys[p.name] !== undefined ? keys[p.name] : ''}
                    onChange={(e) => handleKeyChange(p.name, e.target.value)}
                    placeholder={p.apiKeyMasked || 'Enter new API Key (e.g. sk-... / tvly-...) to update'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 outline-none"
                  />
                  {p.apiKeyMasked && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      Active: {p.apiKeyMasked}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(p.name, p.isEnabled)}
                    disabled={isSaving || !keys[p.name]}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Key'}</span>
                  </button>

                  <button
                    onClick={() => handleTest(p.name)}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Inline Test Result Message */}
              {testRes && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                    testRes.status === 'CONNECTED'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span>{testRes.message}</span>
                  {testRes.latencyMs && (
                    <span className="text-[10px] font-mono">{testRes.latencyMs}ms latency</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
