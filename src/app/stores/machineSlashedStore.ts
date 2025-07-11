import { create } from 'zustand';
import {
  fetchMachineSlashedRecords,
  type ProcessedSlashedRecord
} from '@/app/graphql/machineSlashedQuery';

interface MachineSlashedState {
  slashedRecords: ProcessedSlashedRecord[];
  loading: boolean;
  error: string | null;
  machineId: string;
  
  // Actions
  setMachineId: (machineId: string) => void;
  fetchData: () => Promise<void>;
  reset: () => void;
}

export const useMachineSlashedStore = create<MachineSlashedState>((set, get) => ({
  slashedRecords: [],
  loading: false,
  error: null,
  machineId: '',
  
  setMachineId: (machineId: string) => {
    set({ machineId });
  },
  
  fetchData: async () => {
    const { machineId } = get();
    if (!machineId) return;
    
    set({ loading: true, error: null });
    
    try {
      const records = await fetchMachineSlashedRecords(machineId);
      set({ 
        slashedRecords: records,
        loading: false 
      });
    } catch (err) {
      console.error('获取惩罚记录失败:', err);
      set({ 
        error: err instanceof Error ? err.message : '获取惩罚记录失败',
        loading: false 
      });
    }
  },
  
  reset: () => {
    set({
      slashedRecords: [],
      loading: false,
      error: null,
      machineId: ''
    });
  }
}));