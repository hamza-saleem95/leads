import axios from 'axios';
import { IDiscoveryProvider, ProviderSearchParams } from './types.js';
import { DiscoveredBusiness, ProviderTestResult } from '../types/index.js';
import { config } from '../config/index.js';

export class GooglePlacesAdapter implements IDiscoveryProvider {
  name = 'google_places';
  displayName = 'Google Places API';

  isConfigured(customApiKey?: string): boolean {
    const key = customApiKey || config.providers.googlePlaces.apiKey;
    return Boolean(key && key.trim().length > 5);
  }

  async testConnection(customApiKey?: string): Promise<ProviderTestResult> {
    const key = customApiKey || config.providers.googlePlaces.apiKey;
    if (!key) {
      return {
        provider: this.name,
        status: 'AWAITING_CREDENTIALS',
        message: 'Google Places API key is not configured. Please supply an API key in API Settings.',
      };
    }

    const start = Date.now();
    try {
      const response = await axios.get(`${config.providers.googlePlaces.baseUrl}/textsearch/json`, {
        params: {
          query: 'restaurant in London',
          key,
        },
        timeout: 8000,
      });

      const latencyMs = Date.now() - start;
      if (response.data?.status === 'OK' || response.data?.status === 'ZERO_RESULTS') {
        return {
          provider: this.name,
          status: 'CONNECTED',
          message: 'Google Places API connection successful.',
          latencyMs,
        };
      }
      if (response.data?.status === 'REQUEST_DENIED') {
        return {
          provider: this.name,
          status: 'ERROR',
          message: response.data?.error_message || 'Google Places API key request denied.',
          latencyMs,
        };
      }
      return {
        provider: this.name,
        status: 'CONNECTED',
        message: `Status: ${response.data?.status}`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        provider: this.name,
        status: 'ERROR',
        message: err.message || 'Failed to authenticate with Google Places API',
        latencyMs: Date.now() - start,
      };
    }
  }

  async search(params: ProviderSearchParams): Promise<DiscoveredBusiness[]> {
    const key = params.apiKey || config.providers.googlePlaces.apiKey;
    if (!key) {
      console.warn('[GooglePlacesAdapter] No API key available.');
      return [];
    }

    try {
      const searchQuery = `${params.industry} ${params.city || ''} ${params.country}`.trim();
      const response = await axios.get(`${config.providers.googlePlaces.baseUrl}/textsearch/json`, {
        params: {
          query: searchQuery,
          key,
        },
        timeout: 15000,
      });

      const results = response.data?.results || [];
      const businesses: DiscoveredBusiness[] = [];

      for (const place of results.slice(0, params.quantity || 15)) {
        // We can fetch place details for website & phone if place_id is available
        let website = '';
        let phone = '';

        if (place.place_id) {
          try {
            const detailRes = await axios.get(`${config.providers.googlePlaces.baseUrl}/details/json`, {
              params: {
                place_id: place.place_id,
                fields: 'website,formatted_phone_number,international_phone_number',
                key,
              },
              timeout: 5000,
            });
            website = detailRes.data?.result?.website || '';
            phone = detailRes.data?.result?.formatted_phone_number || detailRes.data?.result?.international_phone_number || '';
          } catch {}
        }

        businesses.push({
          companyName: place.name || 'Business',
          website: website || undefined,
          industry: params.industry,
          businessDescription: `${params.industry} service located at ${place.formatted_address}. Rating: ${place.rating ?? 'N/A'}.`,
          phone: phone || undefined,
          address: place.formatted_address,
          city: params.city,
          country: params.country,
          sourceUrl: website || `https://maps.google.com/?cid=${place.place_id}`,
          sourceProvider: this.name,
          rawMetadata: place,
        });
      }

      return businesses;
    } catch (err: any) {
      console.error('[GooglePlacesAdapter] Search failed:', err.message);
      return [];
    }
  }
}
