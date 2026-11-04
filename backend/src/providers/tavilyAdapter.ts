import axios from 'axios';
import { IDiscoveryProvider, ProviderSearchParams } from './types.js';
import { DiscoveredBusiness, ProviderTestResult } from '../types/index.js';
import { config } from '../config/index.js';

export class TavilyAdapter implements IDiscoveryProvider {
  name = 'tavily';
  displayName = 'Tavily Search API';

  isConfigured(customApiKey?: string): boolean {
    const key = customApiKey || config.providers.tavily.apiKey;
    return Boolean(key && key.trim().length > 5);
  }

  async testConnection(customApiKey?: string): Promise<ProviderTestResult> {
    const key = customApiKey || config.providers.tavily.apiKey;
    if (!key) {
      return {
        provider: this.name,
        status: 'AWAITING_CREDENTIALS',
        message: 'Tavily API key is not configured. Please supply an API key in API Settings.',
      };
    }

    const start = Date.now();
    try {
      const response = await axios.post(
        `${config.providers.tavily.baseUrl}/search`,
        {
          api_key: key,
          query: 'test connection software companies',
          search_depth: 'basic',
          max_results: 1,
        },
        { timeout: 8000 }
      );

      const latencyMs = Date.now() - start;
      if (response.status === 200) {
        return {
          provider: this.name,
          status: 'CONNECTED',
          message: 'Tavily API authenticated successfully.',
          latencyMs,
        };
      }
      return {
        provider: this.name,
        status: 'ERROR',
        message: `Unexpected response status: ${response.status}`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        provider: this.name,
        status: 'ERROR',
        message: err.response?.data?.message || err.message || 'Failed to connect to Tavily API',
        latencyMs: Date.now() - start,
      };
    }
  }

  async search(params: ProviderSearchParams): Promise<DiscoveredBusiness[]> {
    const key = params.apiKey || config.providers.tavily.apiKey;
    if (!key) {
      console.warn('[TavilyAdapter] No API key available.');
      return [];
    }

    try {
      const response = await axios.post(
        `${config.providers.tavily.baseUrl}/search`,
        {
          api_key: key,
          query: params.query,
          search_depth: 'advanced',
          include_domains: [],
          max_results: Math.min(params.quantity || 15, 20),
        },
        { timeout: 15000 }
      );

      const results = response.data?.results || [];
      const businesses: DiscoveredBusiness[] = [];

      for (const item of results) {
        let domain = '';
        try {
          const parsed = new URL(item.url);
          domain = parsed.hostname.replace(/^www\./, '');
        } catch {}

        // Derive company name from title or domain
        const titleParts = (item.title || '').split(/[-–|:•]/);
        const derivedName = titleParts[0]?.trim() || domain;

        businesses.push({
          companyName: derivedName || 'Discovered Business',
          website: item.url,
          industry: params.industry,
          businessDescription: item.content || item.snippet,
          city: params.city,
          country: params.country,
          sourceUrl: item.url,
          sourceProvider: this.name,
          rawMetadata: item,
        });
      }

      return businesses;
    } catch (err: any) {
      console.error('[TavilyAdapter] Search failed:', err.message);
      return [];
    }
  }
}
