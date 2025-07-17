import { create } from 'zustand';
import { fetchRentingMachines, ProcessedRentingRecord, RentingSearchFilters } from '@/app/graphql/rentingMachineQuery';
import { message } from 'antd';

interface RentingMachineState {
  rentingRecords: ProcessedRentingRecord[];
  loading: boolean;
  error: string | null;
  searchFilters: RentingSearchFilters;
  searching: boolean;
  currentPage: number;
  currentPageSize: number;
  total: number;
}

interface RentingMachineActions {
  fetchData: () => Promise<void>;
  handleSearch: (filters: RentingSearchFilters) => Promise<void>;
  handleClearSearch: () => Promise<void>;
  handlePageChange: (page: number, pageSize?: number) => Promise<void>;
  reset: () => void;
}

type RentingMachineStore = RentingMachineState & RentingMachineActions;

const initialState: RentingMachineState = {
  rentingRecords: [],
  loading: false,
  error: null,
  searchFilters: {},
  searching: false,
  currentPage: 1,
  currentPageSize: 20,
  total: 0,
};

export const useRentingMachineStore = create<RentingMachineStore>((set, get) => ({
  ...initialState,

  fetchData: async () => {
    const { currentPage, currentPageSize, searchFilters } = get();
    set({ loading: true, error: null });
    
    try {
      const offset = (currentPage - 1) * currentPageSize;
      const response = await fetchRentingMachines(searchFilters, currentPageSize, offset);
      
      set({
        rentingRecords: response.machines,
        total: response.total,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取租用中机器列表失败';
      set({
        rentingRecords: [],
        total: 0,
        loading: false,
        error: errorMessage
      });
      message.error(errorMessage);
    }
  },

  handleSearch: async (filters: RentingSearchFilters) => {
    set({ 
      searchFilters: filters, 
      currentPage: 1, 
      searching: true,
      error: null 
    });
    
    try {
      const response = await fetchRentingMachines(filters, get().currentPageSize, 0);
      
      set({
        rentingRecords: response.machines,
        total: response.total,
        searching: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索租用中机器失败';
      set({
        rentingRecords: [],
        total: 0,
        searching: false,
        error: errorMessage
      });
      message.error(errorMessage);
    }
  },

  handleClearSearch: async () => {
    set({ 
      searchFilters: {}, 
      currentPage: 1,
      searching: true,
      error: null 
    });
    
    try {
      const response = await fetchRentingMachines({}, get().currentPageSize, 0);
      
      set({
        rentingRecords: response.machines,
        total: response.total,
        searching: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重置搜索失败';
      set({
        rentingRecords: [],
        total: 0,
        searching: false,
        error: errorMessage
      });
      message.error(errorMessage);
    }
  },

  handlePageChange: async (page: number, pageSize?: number) => {
    const newPageSize = pageSize || get().currentPageSize;
    set({ 
      currentPage: page, 
      currentPageSize: newPageSize,
      loading: true,
      error: null 
    });
    
    try {
      const offset = (page - 1) * newPageSize;
      const response = await fetchRentingMachines(get().searchFilters, newPageSize, offset);
      
      set({
        rentingRecords: response.machines,
        total: response.total,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换页面失败';
      set({
        rentingRecords: [],
        total: 0,
        loading: false,
        error: errorMessage
      });
      message.error(errorMessage);
    }
  },

  reset: () => {
    set(initialState);
  },
}));