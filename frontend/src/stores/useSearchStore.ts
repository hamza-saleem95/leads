import { create } from 'zustand';
import { SearchStrategy, ProgressEventPayload, BusinessLead } from '../types/index.js';

interface SearchState {
  currentStrategy: SearchStrategy | null;
  activeJobId: string | null;
  activeProjectId: string | null;
  jobProgress: ProgressEventPayload | null;
  isSearching: boolean;
  liveLeads: BusinessLead[];
  eventSource: EventSource | null;

  setStrategy: (strategy: SearchStrategy | null) => void;
  startJob: (projectId: string, jobId: string) => void;
  stopJob: () => void;
  clearLiveLeads: () => void;
  connectSSE: () => void;
  disconnectSSE: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  currentStrategy: null,
  activeJobId: null,
  activeProjectId: null,
  jobProgress: null,
  isSearching: false,
  liveLeads: [],
  eventSource: null,

  setStrategy: (strategy) => set({ currentStrategy: strategy }),

  startJob: (projectId, jobId) => {
    set({
      activeProjectId: projectId,
      activeJobId: jobId,
      isSearching: true,
      liveLeads: [],
      jobProgress: {
        jobId,
        searchProjectId: projectId,
        stage: 'STARTING',
        progress: 0,
        totalItems: 0,
        processedItems: 0,
        currentMessage: 'Connecting to search engine cluster...',
        status: 'PROCESSING',
      },
    });

    get().connectSSE();
  },

  stopJob: () => {
    set({ isSearching: false, activeJobId: null });
    get().disconnectSSE();
  },

  clearLiveLeads: () => set({ liveLeads: [] }),

  connectSSE: () => {
    const existing = get().eventSource;
    if (existing) {
      existing.close();
    }

    const es = new EventSource('/events/progress');

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CONNECTED') return;

        const currentActiveJobId = get().activeJobId;
        if (currentActiveJobId && data.jobId === currentActiveJobId) {
          set({ jobProgress: data });

          if (data.leadFound) {
            set((state) => ({
              liveLeads: [data.leadFound, ...state.liveLeads.filter(l => l.id !== data.leadFound.id)],
            }));
          }

          if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
            set({ isSearching: false });
          }
        }
      } catch (err) {
        console.warn('Error parsing SSE progress event:', err);
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically
    };

    set({ eventSource: es });
  },

  disconnectSSE: () => {
    const es = get().eventSource;
    if (es) {
      es.close();
      set({ eventSource: null });
    }
  },
}));
