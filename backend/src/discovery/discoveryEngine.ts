import { IDiscoveryProvider } from '../providers/types.js';
import { TavilyAdapter } from '../providers/tavilyAdapter.js';
import { SerpApiAdapter } from '../providers/serpApiAdapter.js';
import { BingAdapter } from '../providers/bingAdapter.js';
import { GooglePlacesAdapter } from '../providers/googlePlacesAdapter.js';
import { WebDirectoryAdapter } from '../providers/webDirectoryAdapter.js';
import { DiscoveredBusiness, ProviderTestResult } from '../types/index.js';
import { db } from '../database/db.js';

export interface DiscoveryOptions {
  industry: string;
  country: string;
  cities?: string[];
  quantity: number;
  queries: { query: string; provider: string }[];
  enabledProviders?: string[];
  userId?: string;
  searchProjectId?: string;
}

export class DiscoveryEngine {
  private static providers: Map<string, IDiscoveryProvider> = new Map([
    ['live_web_directory', new WebDirectoryAdapter()],
    ['tavily', new TavilyAdapter()],
    ['serpapi', new SerpApiAdapter()],
    ['bing', new BingAdapter()],
    ['google_places', new GooglePlacesAdapter()],
  ]);

  static getProvider(name: string): IDiscoveryProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  static getAllProviders(): IDiscoveryProvider[] {
    return Array.from(this.providers.values());
  }

  static async testAllProviders(userConfigs?: Record<string, string>): Promise<ProviderTestResult[]> {
    const results: ProviderTestResult[] = [];
    for (const [name, provider] of this.providers.entries()) {
      const customKey = userConfigs?.[name];
      const res = await provider.testConnection(customKey);
      results.push(res);
    }
    return results;
  }

  /**
   * Dispatches discovery queries across providers
   */
  static async runDiscovery(options: DiscoveryOptions): Promise<DiscoveredBusiness[]> {
    const allDiscovered: DiscoveredBusiness[] = [];
    const activeProviderNames = options.enabledProviders && options.enabledProviders.length > 0
      ? options.enabledProviders
      : Array.from(this.providers.keys());

    console.log(`[DiscoveryEngine] Launching discovery for "${options.industry}" in "${options.country}". Providers: ${activeProviderNames.join(', ')}`);

    for (const queryItem of options.queries) {
      const providerInstance = this.providers.get(queryItem.provider.toLowerCase());
      if (!providerInstance) {
        console.warn(`[DiscoveryEngine] Provider "${queryItem.provider}" not found.`);
        continue;
      }

      if (!providerInstance.isConfigured()) {
        console.warn(`[DiscoveryEngine] Provider "${queryItem.provider}" is not configured with an API key.`);
        continue;
      }

      try {
        const start = Date.now();
        const results = await providerInstance.search({
          query: queryItem.query,
          industry: options.industry,
          country: options.country,
          city: options.cities?.[0],
          quantity: Math.ceil(options.quantity / Math.max(options.queries.length, 1)),
        });

        // Record API usage if userId present
        if (options.userId) {
          await db.recordAPIUsage({
            userId: options.userId,
            provider: queryItem.provider,
            endpoint: 'discovery/search',
            tokensUsed: 0,
            estimatedCost: 0.005, // standard estimate per web search query
            status: 'SUCCESS',
            metadata: { query: queryItem.query, resultsCount: results.length, durationMs: Date.now() - start },
          });
        }

        allDiscovered.push(...results);
      } catch (err: any) {
        console.error(`[DiscoveryEngine] Error searching ${queryItem.provider}:`, err.message);
        if (options.userId) {
          await db.recordAPIUsage({
            userId: options.userId,
            provider: queryItem.provider,
            endpoint: 'discovery/search',
            tokensUsed: 0,
            estimatedCost: 0,
            status: 'ERROR',
            metadata: { query: queryItem.query, error: err.message },
          });
        }
      }
    }

    return allDiscovered;
  }
}
