import axios from 'axios';
import { IDiscoveryProvider, ProviderSearchParams } from './types.js';
import { DiscoveredBusiness, ProviderTestResult } from '../types/index.js';
import { config } from '../config/index.js';

export class BingAdapter implements IDiscoveryProvider {
  name = 'bing';
  displayName = 'Bing Search API';

  isConfigured(customApiKey?: string): boolean {
    const key = customApiKey || config.providers.bing.apiKey;
    return Boolean(key && key.trim().length > 5);
  }

  async testConnection(customApiKey?: string): Promise<ProviderTestResult> {
    const key = customApiKey || config.providers.bing.apiKey;
    if (!key) {
      return {
        provider: this.name,
        status: 'AWAITING_CREDENTIALS',
        message: 'Bing Search API key is not configured. Please supply an API key in API Settings.',
      };
    }

    const start = Date.now();
    try {
      const response = await axios.get(config.providers.bing.baseUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': key },
        params: { q: 'test connection companies', count: 1 },
        timeout: 8000,
      });

      const latencyMs = Date.now() - start;
      if (response.status === 200) {
        return {
          provider: this.name,
          status: 'CONNECTED',
          message: 'Bing Search API connected successfully.',
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
        message: err.response?.data?.message || err.message || 'Failed to authenticate with Bing API',
        latencyMs: Date.now() - start,
      };
    }
  }

  async search(params: ProviderSearchParams): Promise<DiscoveredBusiness[]> {
    const key = params.apiKey || config.providers.bing.apiKey;
    if (!key) {
      console.warn('[BingAdapter] No API key available.');
      return [];
    }

    try {
      const response = await axios.get(config.providers.bing.baseUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': key },
        params: {
          q: `${params.query} ${params.city || ''} ${params.country}`.trim(),
          count: Math.min(params.quantity || 15, 25),
          responseFilter: 'Webpages',
        },
        timeout: 15000,
      });

      const webPages = response.data?.webPages?.value || [];
      const businesses: DiscoveredBusiness[] = [];

      for (const page of webPages) {
        const titleParts = (page.name || '').split(/[-–|:•]/);
        const companyName = titleParts[0]?.trim() || page.displayUrl;

        businesses.push({
          companyName,
          website: page.url,
          industry: params.industry,
          businessDescription: page.snippet,
          city: params.city,
          country: params.country,
          sourceUrl: page.url,
          sourceProvider: this.name,
          rawMetadata: page,
        });
      }

      return businesses;
    } catch (err: any) {
      console.error('[BingAdapter] Search failed:', err.message);
      return [];
    }
  }
}
