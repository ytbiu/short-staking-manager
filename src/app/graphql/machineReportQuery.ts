import { graphEndpoint } from "../const/const";

// 机器举报记录查询
export const machineReportQuery = `
query GetMachineReports($machineId: String!) {
  machineOfflineRecords(
    orderBy: blockTimestamp
    orderDirection: desc
    where: {
      machineId: $machineId
    }
  ) {
    machineId
    blockTimestamp
  }
  
  machineReOnlineRecords(
    orderBy: blockTimestamp
    orderDirection: desc
    where: {
      machineId: $machineId
    }
  ) {
    machineId
    blockTimestamp
  }
}`;

// 举报记录类型定义
export interface ReportEvent {
  machineId: string;
  blockTimestamp: string;
}

export interface MachineReportData {
  machineOfflineRecords: ReportEvent[];
  machineReOnlineRecords: ReportEvent[];
}

// 处理后的举报记录
export interface ProcessedReportRecord {
  offlineTime: string;
  reonlineTime?: string;
  duration?: number; // 离线持续时间（秒）
  status: 'offline' | 'recovered'; // 当前状态
  offlineEvent: ReportEvent;
  reonlineEvent?: ReportEvent;
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
        query: machineReportQuery,
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
    
    // 处理数据，将offline和reonline事件配对
    return processReportRecords(data.machineOfflineRecords, data.machineReOnlineRecords);
  } catch (error) {
    console.error('Error fetching machine reports:', error);
    throw error;
  }
}

// 处理举报记录，将offline和reonline事件配对
function processReportRecords(
  offlineEvents: ReportEvent[],
  reonlineEvents: ReportEvent[]
): ProcessedReportRecord[] {
  const records: ProcessedReportRecord[] = [];
  
  // 按时间戳排序（最新的在前）
  const sortedOfflineEvents = [...offlineEvents].sort((a, b) => 
    parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp)
  );
  const sortedReonlineEvents = [...reonlineEvents].sort((a, b) => 
    parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp)
  );
  
  // 为每个offline事件找到对应的reonline事件
  for (const offlineEvent of sortedOfflineEvents) {
    const offlineTimestamp = parseInt(offlineEvent.blockTimestamp);
    
    // 找到在此offline事件之后的第一个reonline事件
    const correspondingReonlineEvent = sortedReonlineEvents.find(
      reonlineEvent => parseInt(reonlineEvent.blockTimestamp) > offlineTimestamp
    );
    
    const record: ProcessedReportRecord = {
      offlineTime: new Date(offlineTimestamp * 1000).toLocaleString('zh-CN'),
      offlineEvent,
      status: correspondingReonlineEvent ? 'recovered' : 'offline'
    };
    
    if (correspondingReonlineEvent) {
      const reonlineTimestamp = parseInt(correspondingReonlineEvent.blockTimestamp);
      record.reonlineTime = new Date(reonlineTimestamp * 1000).toLocaleString('zh-CN');
      record.duration = reonlineTimestamp - offlineTimestamp;
      record.reonlineEvent = correspondingReonlineEvent;
    }
    
    records.push(record);
  }
  
  return records;
}

// 判断机器当前是否因举报而离线
export function isMachineCurrentlyOffline(records: ProcessedReportRecord[]): boolean {
  if (records.length === 0) return false;
  
  // 获取最新的记录
  const latestRecord = records[0];
  return latestRecord.status === 'offline';
}

// 格式化持续时间
export function formatDuration(seconds: number): string {
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