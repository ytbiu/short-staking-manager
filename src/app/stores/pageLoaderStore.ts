import { create } from 'zustand';

interface PageLoaderState {
  isLoading: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  finishLoading: () => void;
  reset: () => void;
}

export const usePageLoaderStore = create<PageLoaderState>((set) => ({
  isLoading: true,
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  startLoading: () => {
    set({ isLoading: true });
  },
  
  finishLoading: () => {
    set({ isLoading: false });
  },
  
  reset: () => {
    set({ isLoading: true });
  }
}));