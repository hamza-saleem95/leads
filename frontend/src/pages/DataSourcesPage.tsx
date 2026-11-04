import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ProviderConfig } from '../types/index.js';
import { Database, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Key, ExternalLink } from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [testingName, setTestingName] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
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

  const handleTest = async (name: string) => {
    setTestingName(name);
    setTestResult(null);
    try {
      const res = await api.testProvider(name);
      setTestResult({ provider: name, ...res });
      loadProviders();
    } catch (e: any) {
      setTestResult({ provider: name, status: 'ERROR', message: e.message });
    } finally {
      setTestingName(null);
    }
  };

  const providerDetails: Record<string, { desc: string; url: string; tags: string[] }> = {
    openai: {
      desc: 'OpenAI GPT-4o-mini engine powering conversational natural language request understanding, keyword generation, and multi-query search strategies.',
      url: 'https://platform.openai.com',
      tags: ['Natural Language AI', 'Structured JSON Output', 'GPT-4o-mini'],
    },
    tavily: {
      desc: 'Optimized search engine for AI agents providing accurate web intelligence and company index discovery.',
      url: 'https://tavily.com',
      tags: ['Corporate Directories', 'Official Websites', 'Advanced Depth'],
    },
    serpapi: {
      desc: 'Real-time Google search scraper and Google Maps local place indexer for exact geographic business coordinates.',
      url: 'https://serpapi.com',
      tags: ['Google Search', 'Google Maps', 'Local Pack'],
    },
    google_places: {
      desc: 'Direct Google Places API integrating verified physical business storefronts, ratings, and phone numbers.',
      url: 'https://developers.google.com/maps/documentation/places/web-service',
      tags: ['Verified Locations', 'Storefront Addresses', 'Direct Phones'],
    },
    bing: {
      desc: 'Microsoft Bing Search API v7 indexing commercial organization websites and enterprise web profiles.',
      url: 'https://www.microsoft.com/en-us/bing/apis/bing-web-search-api',
      tags: ['Global Web Index', 'Enterprise Directories'],
    },
    email_verifier: {
      desc: 'Corporate email validation and MX resolver ensuring deliverability and filtering disposable inboxes.',
      url: 'https://hunter.io',
      tags: ['Syntax Check', 'DNS MX Lookup', 'Deliverability Scoring'],
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Data Sources & Search Provider Cluster
          </h2>
          <p className="text-xs text-slate-400">
            Multi-source business discovery adapters with dedicated rate limiting, robots.txt compliance, and provenance.
          </p>
        </div>
      </div>

      {/* Compliance Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3.5 text-xs text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white">Sanctioned Public Discovery Architecture</span>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            AI Lead Finder extracts publicly listed corporate information only from official company websites and
            authorized search directories. Private personal data is never scraped. Concurrency throttling and robots.txt
            directives are strictly observed.
          </p>
        </div>
      </div>

      {/* Providers Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {providers.map((p) => {
            const meta = providerDetails[p.name] || {
              desc: 'Modular discovery provider adapter.',
              url: '#',
              tags: ['Custom Provider'],
            };
            const isTesting = testingName === p.name;

            return (
              <div
                key={p.name}
                className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{p.displayName}</h3>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{p.name}</span>
                      </div>
                    </div>

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
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{meta.desc}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {meta.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] text-slate-400 border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <a
                    href={meta.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <span>Provider Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    <a
                      href="/settings/api"
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Configure
                    </a>
                    <button
                      onClick={() => handleTest(p.name)}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Result Toast/Card */}
      {testResult && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between animate-fade-in text-xs">
          <div className="space-y-1">
            <span className="font-bold text-white uppercase">{testResult.provider} Test Result</span>
            <p className="text-slate-300">{testResult.message}</p>
            {testResult.latencyMs && (
              <span className="text-[11px] text-indigo-400">Response Latency: {testResult.latencyMs}ms</span>
            )}
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
