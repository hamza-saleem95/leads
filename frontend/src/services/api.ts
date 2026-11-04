import axios from 'axios';
import {
  BusinessLead,
  DashboardStats,
  SearchStrategy,
  SearchProject,
  SearchJob,
  ProviderConfig,
  APIUsageStats,
  LeadStatus,
} from '../types/index.js';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((req) => {
  const token = localStorage.getItem('ai_lead_finder_token');
  if (token) {
    req.headers['Authorization'] = `Bearer ${token}`;
  }
  return req;
});

export const api = {
  // Auth
  getMe: async () => (await apiClient.get('/auth/me')).data,

  // Dashboard
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data.data;
  },

  // Search Assistant
  generateStrategy: async (data: { prompt?: string; questionnaire?: any }): Promise<SearchStrategy> => {
    const res = await apiClient.post('/search/assistant/strategy', data);
    return res.data.strategy;
  },

  generateSearchStrategy: async (data: { prompt?: string; questionnaire?: any }): Promise<SearchStrategy> => {
    const res = await apiClient.post('/search/assistant/strategy', data);
    return res.data.strategy;
  },

  launchSearch: async (data: { strategy: SearchStrategy; projectName?: string }): Promise<{ projectId: string; jobId: string }> => {
    const res = await apiClient.post('/search/assistant/launch', data);
    return res.data;
  },

  getProjects: async (): Promise<SearchProject[]> => {
    const res = await apiClient.get('/search/projects');
    return res.data.projects;
  },

  getProject: async (id: string): Promise<{ project: SearchProject; jobs: SearchJob[] }> => {
    const res = await apiClient.get(`/search/projects/${id}`);
    return res.data;
  },

  getJob: async (id: string): Promise<SearchJob> => {
    const res = await apiClient.get(`/search/jobs/${id}`);
    return res.data.job;
  },

  cancelJob: async (id: string) => (await apiClient.post(`/search/jobs/${id}/cancel`)).data,
  pauseJob: async (id: string) => (await apiClient.post(`/search/jobs/${id}/pause`)).data,
  resumeJob: async (id: string) => (await apiClient.post(`/search/jobs/${id}/resume`)).data,
  retryJob: async (id: string) => (await apiClient.post(`/search/jobs/${id}/retry`)).data,

  // Leads
  getLeads: async (params: Record<string, any>): Promise<{ data: BusinessLead[]; pagination: any }> => {
    const res = await apiClient.get('/leads', { params });
    return res.data;
  },

  getLeadById: async (id: string): Promise<BusinessLead> => {
    const res = await apiClient.get(`/leads/${id}`);
    return res.data.lead;
  },

  createLead: async (data: Partial<BusinessLead>): Promise<BusinessLead> => {
    const res = await apiClient.post('/leads', data);
    return res.data.lead;
  },

  updateLead: async (id: string, updates: Partial<BusinessLead>): Promise<BusinessLead> => {
    const res = await apiClient.patch(`/leads/${id}`, updates);
    return res.data.lead;
  },

  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  bulkUpdateStatus: async (ids: string[], status: LeadStatus) => {
    return (await apiClient.post('/leads/bulk-status', { ids, status })).data;
  },

  bulkDelete: async (ids: string[]) => {
    return (await apiClient.post('/leads/bulk-delete', { ids })).data;
  },

  toggleSave: async (id: string, tags: string[] = []): Promise<boolean> => {
    const res = await apiClient.post(`/leads/${id}/save`, { tags });
    return res.data.isSaved;
  },

  getSavedLeads: async (): Promise<BusinessLead[]> => {
    const res = await apiClient.get('/leads/saved');
    return res.data.leads;
  },

  addNote: async (leadId: string, note: string) => {
    return (await apiClient.post(`/leads/${leadId}/notes`, { note })).data.note;
  },

  deleteNote: async (noteId: string) => {
    return (await apiClient.delete(`/leads/notes/${noteId}`)).data;
  },

  // Export URLs
  getCSVExportUrl: (filters: Record<string, any>) => {
    const searchParams = new URLSearchParams(filters);
    return `/api/leads/export/csv?${searchParams.toString()}`;
  },

  getExcelExportUrl: (filters: Record<string, any>) => {
    const searchParams = new URLSearchParams(filters);
    return `/api/leads/export/xlsx?${searchParams.toString()}`;
  },

  // Settings
  getProviders: async (): Promise<ProviderConfig[]> => {
    const res = await apiClient.get('/settings/providers');
    return res.data.providers;
  },

  updateProvider: async (name: string, data: { apiKey?: string; isEnabled?: boolean }) => {
    return (await apiClient.post(`/settings/providers/${name}`, data)).data;
  },

  testProvider: async (name: string, apiKey?: string) => {
    return (await apiClient.post(`/settings/providers/${name}/test`, { apiKey })).data.result;
  },

  getUsage: async (): Promise<APIUsageStats> => {
    const res = await apiClient.get('/settings/usage');
    return res.data.usage;
  },

  getAuditLogs: async () => {
    const res = await apiClient.get('/settings/audit-logs');
    return res.data.logs;
  },
};
