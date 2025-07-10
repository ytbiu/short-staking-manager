import { graphEndpoint } from '../const/const';

// GraphQL查询
const GET_MACHINE_REPORTS = `
  query GetMachineReports($machineId: String!) {
    machineReportedRecords(
      where: { 
        machineId: $machineId
      }
      orderBy: offlineBlockTimestamp
      orderDirection: desc
    ) {
      id
      machineId
      offlineBlockTimestamp
      reOnlineBlockTimestamp
      offlineTransactionHash
      reOnlineTransactionHash
      unStakeBlockTimestamp
      unStakeTransactionHash
      finishedByEndStake
      finishedByReOnline
      offlineDuration
    }
  }
`;

// 类型定义
export interface MachineReportedRecord {
  id: string;
  machineId: string;
  offlineBlockTimestamp: string;
  reOnlineBlockTimestamp: string;
  offlineTransactionHash: string;
  reOnlineTransactionHash: string;
  unStakeBlockTimestamp: string;
  unStakeTransactionHash: string;
  finishedByEndStake: boolean;
  finishedByReOnline: boolean;
  offlineDuration: string;
}

export interface MachineReportData {
  machineReportedRecords: MachineReportedRecord[];
}

export interface ProcessedReportRecord {
  id: string;
  offlineTime: Date;
  reOnlineTime?: Date;
  unStakeTime?: Date;
  duration: string;
  status: 'offline' | 'online' | 'unstaked';
  offlineTransactionHash: string;
  reOnlineTransactionHash: string;
  unStakeTransactionHash: string;
  finishedByEndStake: boolean;
  finishedByReOnline: boolean;
}

// 获取机器举报记录
export async function fetchMachineReports(machineId: string): Promise<ProcessedReportRecord[]> {
  try {
    const response = await fetch(graphEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_MACHINE_REPORTS,
        variables: { machineId },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const data: MachineReportData = result.data;
    
    // 处理数据
    return processReportRecords(data.machineReportedRecords);
  } catch (error) {
    console.error('Error fetching machine reports:', error);
    throw error;
  }
}

// 处理举报记录
function processReportRecords(
  reportedRecords: MachineReportedRecord[]
): ProcessedReportRecord[] {
  return reportedRecords.map(record => {
     const offlineTime = new Date(parseInt(record.offlineBlockTimestamp) * 1000);
     const reOnlineTime = record.reOnlineBlockTimestamp && record.reOnlineBlockTimestamp !== '0'
       ? new Date(parseInt(record.reOnlineBlockTimestamp) * 1000) 
       : undefined;
     const unStakeTime = record.unStakeBlockTimestamp && record.unStakeBlockTimestamp !== '0'
       ? new Date(parseInt(record.unStakeBlockTimestamp) * 1000) 
       : undefined;
    
    let status: 'offline' | 'online' | 'unstaked';
    if (record.finishedByEndStake) {
      status = 'unstaked';
    } else if (record.finishedByReOnline) {
      status = 'online';
    } else {
      status = 'offline';
    }
    
    return {
      id: record.id,
      offlineTime,
      reOnlineTime,
      unStakeTime,
      duration: record.offlineDuration,
      status,
      offlineTransactionHash: record.offlineTransactionHash || '',
      reOnlineTransactionHash: record.reOnlineTransactionHash || '',
      unStakeTransactionHash: record.unStakeTransactionHash || '',
      finishedByEndStake: record.finishedByEndStake,
      finishedByReOnline: record.finishedByReOnline
    };
  });
}

// 判断机器当前是否离线
export function isMachineCurrentlyOffline(reports: ProcessedReportRecord[]): boolean {
  if (reports.length === 0) return false;
  
  // 获取最新的记录
  const latestReport = reports[0];
  return latestReport.status === 'offline';
}

// 格式化持续时间（输入为秒数字符串）
export function formatDuration(durationStr: string): string {
  const seconds = parseInt(durationStr);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${remainingSeconds}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${remainingSeconds}秒`;
  } else {
    return `${remainingSeconds}秒`;
  }
}