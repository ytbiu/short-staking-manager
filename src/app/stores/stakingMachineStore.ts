import { create } from 'zustand';
import { fetchStakingMachines, StakingMachine, SearchFilters } from '@/app/graphql/stakingMachinesQuery';

interface StakingMachineState {
  machines: StakingMachine[];
  currentPage: number;
  currentPageSize: number;
  total: number;
  loading: boolean;
  currentSortBy: string;
  currentSortOrder: string;
  searchFilters: SearchFilters;
  
  // Actions
  setMachines: (machines: StakingMachine[]) => void;
  setCurrentPage: (page: number) => void;
  setCurrentPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: string) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  
  // Complex actions
  fetchData: () => Promise<void>;
  handlePageChange: (page: number, size: number) => void;
  handleSort: (sortBy: string, sortOrder: string) => void;
  handleSearch: (filters: SearchFilters) => void;
  reset: () => void;
}

const initialState = {
  machines: [],
  currentPage: 1,
  currentPageSize: 10,
  total: 0,
  loading: false,
  currentSortBy: 'totalClaimedRewardAmount',
  currentSortOrder: 'desc',
  searchFilters: {},
};

export const useStakingMachineStore = create<StakingMachineState>((set, get) => ({
  ...initialState,
  
  setMachines: (machines) => set({ machines }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setCurrentPageSize: (currentPageSize) => set({ currentPageSize }),
  setTotal: (total) => set({ total }),
  setLoading: (loading) => set({ loading }),
  setSortBy: (currentSortBy) => set({ currentSortBy }),
  setSortOrder: (currentSortOrder) => set({ currentSortOrder }),
  setSearchFilters: (searchFilters) => set({ searchFilters }),
  
  fetchData: async () => {
    const { currentPage, currentPageSize, currentSortBy, currentSortOrder, searchFilters } = get();
    set({ loading: true });
    
    try {
      const response = await fetchStakingMachines(
        currentPage,
        currentPageSize,
        currentSortBy,
        currentSortOrder,
        searchFilters
      );
      set({ 
        machines: response.machines,
        total: response.total 
      });
    } catch (error) {
      console.error('Failed to fetch staking machines:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  handlePageChange: (page, size) => {
    set({ currentPage: page, currentPageSize: size });
    get().fetchData();
  },
  
  handleSort: (sortBy, sortOrder) => {
    set({ 
      currentSortBy: sortBy,
      currentSortOrder: sortOrder,
      currentPage: 1 // 重置到第一页
    });
    get().fetchData();
  },
  
  handleSearch: (filters) => {
    // 过滤掉空值，支持字符串和布尔值
    const filteredValues = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => {
        if (typeof value === 'string') {
          return value && value.trim() !== '';
        }
        if (typeof value === 'boolean') {
          return true; // 布尔值都是有效的
        }
        return value !== undefined && value !== null;
      })
    );
    
    set({ 
      searchFilters: filteredValues,
      currentPage: 1 // 重置到第一页
    });
    get().fetchData();
  },
  
  reset: () => {
    set(initialState);
  }
}));