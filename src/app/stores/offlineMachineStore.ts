import { create } from 'zustand';
import { fetchOfflineMachines, ProcessedOfflineRecord, OfflineSearchFilters } from '@/app/graphql/offlineMachineQuery';

interface OfflineMachineState {
  offlineRecords: ProcessedOfflineRecord[];
  loading: boolean;
  error: string | null;
  searchFilters: OfflineSearchFilters;
  searching: boolean;
  currentPage: number;
  currentPageSize: number;
  total: number;
  
  // Actions
  setOfflineRecords: (records: ProcessedOfflineRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchFilters: (filters: OfflineSearchFilters) => void;
  setSearching: (searching: boolean) => void;
  setCurrentPage: (page: number) => void;
  setCurrentPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  
  // Complex actions
  fetchData: (filters?: OfflineSearchFilters, page?: number, pageSize?: number) => Promise<void>;
  handleSearch: (filters: OfflineSearchFilters) => Promise<void>;
  handleClearSearch: () => Promise<void>;
  handlePageChange: (page: number, pageSize: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  offlineRecords: [],
  loading: true,
  error: null,
  searchFilters: {},
  searching: false,
  currentPage: 1,
  currentPageSize: 20,
  total: 0,
};

export const useOfflineMachineStore = create<OfflineMachineState>((set, get) => ({
  ...initialState,
  
  setOfflineRecords: (offlineRecords) => set({ offlineRecords }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchFilters: (searchFilters) => set({ searchFilters }),
  setSearching: (searching) => set({ searching }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setCurrentPageSize: (currentPageSize) => set({ currentPageSize }),
  setTotal: (total) => set({ total }),
  
  fetchData: async (filters, page, pageSize) => {
    const state = get();
    const actualFilters = filters ?? state.searchFilters;
    const actualPage = page ?? state.currentPage;
    const actualPageSize = pageSize ?? state.currentPageSize;
    
    try {
      set({ loading: true, error: null });
      
      const offset = (actualPage - 1) * actualPageSize;
      const response = await fetchOfflineMachines(actualFilters, actualPageSize, offset);
      
      set({ 
        offlineRecords: response.machines,
        total: response.total,
        currentPage: actualPage,
        currentPageSize: actualPageSize
      });
    } catch (err) {
      console.error('获取离线机器记录失败:', err);
      set({ error: err instanceof Error ? err.message : '获取离线机器记录失败' });
    } finally {
      set({ loading: false });
    }
  },
  
  handleSearch: async (filters) => {
    set({ searching: true });
    
    // 过滤掉空值
    const filteredValues = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && value.trim() !== '')
    );
    
    set({ 
      searchFilters: filteredValues,
      currentPage: 1 // 重置到第一页
    });
    
    await get().fetchData(filteredValues, 1, get().currentPageSize);
    set({ searching: false });
  },
  
  handleClearSearch: async () => {
    set({ 
      searchFilters: {},
      currentPage: 1 // 重置到第一页
    });
    await get().fetchData({}, 1, get().currentPageSize);
  },
  
  handlePageChange: async (page, pageSize) => {
    const state = get();
    
    if (pageSize !== state.currentPageSize) {
      // 页面大小改变，重置到第一页
      await get().fetchData(state.searchFilters, 1, pageSize);
    } else {
      // 只是页码改变
      await get().fetchData(state.searchFilters, page, pageSize);
    }
  },
  
  reset: () => {
    set(initialState);
  }
}));