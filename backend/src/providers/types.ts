import { DiscoveredBusiness, ProviderTestResult } from '../types/index.js';

export interface ProviderSearchParams {
  query: string;
  industry: string;
  country: string;
  city?: string;
  quantity?: number;
  apiKey?: string;
}

export interface IDiscoveryProvider {
  name: string;
  displayName: string;
  isConfigured(customApiKey?: string): boolean;
  testConnection(customApiKey?: string): Promise<ProviderTestResult>;
  search(params: ProviderSearchParams): Promise<DiscoveredBusiness[]>;
}
