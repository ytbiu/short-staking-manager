import { create } from 'zustand';
import { viemClient, CONTRACT_CONFIG, MACHINE_INFO_CONTRACT_CONFIG } from '@/app/config/viem';
import { fetchMachineUnregisterRecords, ProcessedUnregisterRecord } from '@/app/graphql/machineUnregisterQuery';

interface ContractData {
  canRent: boolean;
  reason: string;
  inWhiteList: boolean;
}

interface MachineInfo {
  holder: string;
  calcPoint: bigint;
  startAtTimestamp: bigint;
  endAtTimestamp: bigint;
  nextRenterCanRentAt: bigint;
  reservedAmount: bigint;
  isOnline: boolean;
  isRegistered: boolean;
}

interface MachineDetailState {
  contractData: ContractData | null;
  machineInfo: MachineInfo | null;
  loading: boolean;
  error: string | null;
  machineInfoError: string | null;
  machineInfoLoading: boolean;
  unregisterRecords: ProcessedUnregisterRecord[];
  unregisterLoading: boolean;
  unregisterError: string | null;
  machineId: string;
  
  // Actions
  setMachineId: (machineId: string) => void;
  fetchContractData: () => Promise<void>;
  fetchMachineInfo: () => Promise<void>;
  fetchUnregisterRecords: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  reset: () => void;
}

export const useMachineDetailStore = create<MachineDetailState>((set, get) => ({
  contractData: null,
  machineInfo: null,
  loading: false,
  error: null,
  machineInfoError: null,
  machineInfoLoading: false,
  unregisterRecords: [],
  unregisterLoading: false,
  unregisterError: null,
  machineId: '',
  
  setMachineId: (machineId: string) => {
    set({ machineId });
  },
  
  fetchContractData: async () => {
    const { machineId } = get();
    if (!machineId) return;
    
    set({ loading: true, error: null });
    
    try {
      // 并行调用三个合约函数
      const [canRentResult, reasonResult, whiteListResult] = await Promise.all([
        viemClient.readContract({
          address: CONTRACT_CONFIG.address,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'canRent',
          args: [machineId],
        }),
        viemClient.readContract({
          address: CONTRACT_CONFIG.address,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'resonFoCanNotRent',
          args: [machineId],
        }),
        viemClient.readContract({
          address: CONTRACT_CONFIG.address,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'inRentWhiteList',
          args: [machineId],
        }),
      ]);

      set({
        contractData: {
          canRent: canRentResult as boolean,
          reason: reasonResult as string,
          inWhiteList: whiteListResult as boolean,
        },
        loading: false
      });
    } catch (err) {
      console.error('合约调用失败:', err);
      set({ 
        error: err instanceof Error ? err.message : '合约调用失败',
        loading: false 
      });
    }
  },
  
  fetchMachineInfo: async () => {
    const { machineId } = get();
    if (!machineId) return;
    
    set({ machineInfoLoading: true, machineInfoError: null });
    
    try {
      // 使用正确的机器信息合约调用getMachineInfo
      const result = await viemClient.readContract({
        address: MACHINE_INFO_CONTRACT_CONFIG.address,
        abi: MACHINE_INFO_CONTRACT_CONFIG.abi,
        functionName: 'getMachineInfo',
        args: [machineId],
      });
      
      // 检查返回结果的类型和长度
      if (!Array.isArray(result)) {
        throw new Error(`Expected array result, got: ${typeof result}`);
      }
      
      if (result.length !== 8) {
        throw new Error(`Expected 8 return values, got: ${result.length}`);
      }

      const [holder, calcPoint, startAtTimestamp, endAtTimestamp, nextRenterCanRentAt, reservedAmount, isOnline, isRegistered] = result as [string, bigint, bigint, bigint, bigint, bigint, boolean, boolean];

      set({
        machineInfo: {
          holder,
          calcPoint,
          startAtTimestamp,
          endAtTimestamp,
          nextRenterCanRentAt,
          reservedAmount,
          isOnline,
          isRegistered,
        },
        machineInfoLoading: false
      });
    } catch (err) {
      console.error('获取机器信息失败:', err);
      set({ 
        machineInfoError: err instanceof Error ? err.message : '获取机器信息失败',
        machineInfoLoading: false 
      });
    }
  },
  
  fetchUnregisterRecords: async () => {
    const { machineId } = get();
    if (!machineId) return;
    
    set({ unregisterLoading: true, unregisterError: null });
    
    try {
      const records = await fetchMachineUnregisterRecords(machineId);
      set({ 
        unregisterRecords: records,
        unregisterLoading: false 
      });
    } catch (err) {
      console.error('获取注销注册记录失败:', err);
      set({ 
        unregisterError: err instanceof Error ? err.message : '获取注销注册记录失败',
        unregisterLoading: false 
      });
    }
  },
  
  fetchAllData: async () => {
    const { machineId } = get();
    if (!machineId) return;
    
    const { fetchContractData, fetchMachineInfo, fetchUnregisterRecords } = get();
    
    // 并行执行所有数据获取
    await Promise.all([
      fetchContractData(),
      fetchMachineInfo(),
      fetchUnregisterRecords()
    ]);
  },
  
  reset: () => {
    set({
      contractData: null,
      machineInfo: null,
      loading: false,
      error: null,
      machineInfoError: null,
      machineInfoLoading: false,
      unregisterRecords: [],
      unregisterLoading: false,
      unregisterError: null,
      machineId: ''
    });
  }
}));