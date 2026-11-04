import axios from 'axios';
import { IDiscoveryProvider, ProviderSearchParams } from './types.js';
import { DiscoveredBusiness, ProviderTestResult } from '../types/index.js';
import { config } from '../config/index.js';

export class SerpApiAdapter implements IDiscoveryProvider {
  name = 'serpapi';
  displayName = 'SerpAPI (Google Search & Maps)';

  isConfigured(customApiKey?: string): boolean {
    const key = customApiKey || config.providers.serpapi.apiKey;
    return Boolean(key && key.trim().length > 5);
  }

  async testConnection(customApiKey?: string): Promise<ProviderTestResult> {
    const key = customApiKey || config.providers.serpapi.apiKey;
    if (!key) {
      return {
        provider: this.name,
        status: 'AWAITING_CREDENTIALS',
        message: 'SerpAPI key is not configured. Please supply an API key in API Settings.',
      };
    }

    const start = Date.now();
    try {
      const response = await axios.get(`${config.providers.serpapi.baseUrl}/account`, {
        params: { api_key: key },
        timeout: 8000,
      });

      const latencyMs = Date.now() - start;
      if (response.status === 200 && response.data?.account_email) {
        return {
          provider: this.name,
          status: 'CONNECTED',
          message: `SerpAPI connected for account: ${response.data.account_email}. Total searches left: ${response.data.total_searches_left ?? 'N/A'}.`,
          latencyMs,
        };
      }
      return {
        provider: this.name,
        status: 'CONNECTED',
        message: 'SerpAPI responded successfully.',
        latencyMs,
      };
    } catch (err: any) {
      return {
        provider: this.name,
        status: 'ERROR',
        message: err.response?.data?.error || err.message || 'Failed to authenticate with SerpAPI',
        latencyMs: Date.now() - start,
      };
    }
  }

  async search(params: ProviderSearchParams): Promise<DiscoveredBusiness[]> {
    const key = params.apiKey || config.providers.serpapi.apiKey;
    if (!key) {
      console.warn('[SerpApiAdapter] No API key available.');
      return [];
    }

    try {
      // Perform Google Search with location targeting
      const response = await axios.get(`${config.providers.serpapi.baseUrl}/search.json`, {
        params: {
          engine: 'google',
          q: params.query,
          location: params.city ? `${params.city}, ${params.country}` : params.country,
          hl: 'en',
          gl: params.country.toLowerCase().slice(0, 2),
          num: Math.min(params.quantity || 10, 20),
          api_key: key,
        },
        timeout: 15000,
      });

      const organic = response.data?.organic_results || [];
      const localResults = response.data?.local_results?.places || [];
      const businesses: DiscoveredBusiness[] = [];

      // Process local places if available (often contains phone & address)
      for (const place of localResults) {
        businesses.push({
          companyName: place.title || 'Local Business',
          website: place.links?.website || place.link,
          industry: params.industry,
          businessDescription: place.description || `${params.industry} in ${place.address || params.city}`,
          address: place.address,
          phone: place.phone,
          city: params.city,
          country: params.country,
          sourceUrl: place.link || response.data?.search_metadata?.google_url,
          sourceProvider: this.name,
          rawMetadata: place,
        });
      }

      // Process organic search results
      for (const item of organic) {
        if (!item.link || item.link.includes('wikipedia.org') || item.link.includes('tripadvisor')) continue;

        const titleParts = (item.title || '').split(/[-–|:•]/);
        const companyName = titleParts[0]?.trim() || item.displayed_link;

        businesses.push({
          companyName: companyName,
          website: item.link,
          industry: params.industry,
          businessDescription: item.snippet,
          city: params.city,
          country: params.country,
          sourceUrl: item.link,
          sourceProvider: this.name,
          rawMetadata: item,
        });
      }

      return businesses;
    } catch (err: any) {
      console.error('[SerpApiAdapter] Search failed:', err.message);
      return [];
    }
  }
}
