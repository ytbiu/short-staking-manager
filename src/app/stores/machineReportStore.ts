import { create } from 'zustand';
import { 
  fetchMachineReports, 
  ProcessedReportRecord, 
  isMachineCurrentlyOffline
} from '@/app/graphql/machineReportQuery';

interface MachineReportState {
  reportRecords: ProcessedReportRecord[];
  loading: boolean;
  error: string | null;
  currentlyOffline: boolean;
  machineId: string;
  
  // Actions
  setMachineId: (machineId: string) => void;
  fetchData: () => Promise<void>;
  reset: () => void;
}

export const useMachineReportStore = create<MachineReportState>((set, get) => ({
  reportRecords: [],
  loading: false,
  error: null,
  currentlyOffline: false,
  machineId: '',
  
  setMachineId: (machineId: string) => {
    set({ machineId });
  },
  
  fetchData: async () => {
    const { machineId } = get();
    if (!machineId) return;
    
    set({ loading: true, error: null });
    
    try {
      const records = await fetchMachineReports(machineId);
      const currentlyOffline = isMachineCurrentlyOffline(records);
      
      set({ 
        reportRecords: records,
        currentlyOffline,
        loading: false 
      });
    } catch (err) {
      console.error('获取举报记录失败:', err);
      set({ 
        error: err instanceof Error ? err.message : '获取举报记录失败',
        loading: false 
      });
    }
  },
  
  reset: () => {
    set({
      reportRecords: [],
      loading: false,
      error: null,
      currentlyOffline: false,
      machineId: ''
    });
  }
}));