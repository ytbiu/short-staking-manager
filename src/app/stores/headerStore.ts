import { create } from 'zustand';

interface HeaderState {
  deviceId: string;
  machineId: string;
  loading: boolean;
  setDeviceId: (deviceId: string) => void;
  setMachineId: (machineId: string) => void;
  setLoading: (loading: boolean) => void;
  searchMachineId: (deviceId: string) => Promise<void>;
  copyMachineId: () => void;
  reset: () => void;
}

export const useHeaderStore = create<HeaderState>((set, get) => ({
  deviceId: '',
  machineId: '',
  loading: false,
  
  setDeviceId: (deviceId) => set({ deviceId }),
  setMachineId: (machineId) => set({ machineId }),
  setLoading: (loading) => set({ loading }),
  
  searchMachineId: async (deviceId: string) => {
    if (!deviceId.trim()) {
      // 使用动态导入避免SSR问题
      const { message } = await import('antd');
      message.warning('请输入设备ID');
      return;
    }

    set({ loading: true });
    try {
      const response = await fetch(`https://nodeapi.deeplink.cloud/api/cyc/getMachineID?device_id=${deviceId.trim()}`);
      const data = await response.json();
      
      if (data.success && data.code === 1) {
        set({ machineId: data.content.machine_id });
        const { message } = await import('antd');
        message.success('查询成功');
      } else {
        const { message } = await import('antd');
        message.error(data.msg || '查询失败');
        set({ machineId: '' });
      }
    } catch (error) {
      console.error('查询错误:', error);
      const { message } = await import('antd');
      message.error('查询失败，请检查网络连接');
      set({ machineId: '' });
    } finally {
      set({ loading: false });
    }
  },
  
  copyMachineId: async () => {
    const { machineId } = get();
    if (machineId) {
      await navigator.clipboard.writeText(machineId);
      const { message } = await import('antd');
      message.success('机器ID已复制到剪贴板');
    }
  },
  
  reset: () => set({ deviceId: '', machineId: '', loading: false })
}));