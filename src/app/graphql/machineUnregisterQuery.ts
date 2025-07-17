import { graphEndpoint } from '../const/const';

// GraphQL查询
const GET_MACHINE_UNREGISTER_RECORDS = `
  query GetMachineUnregisterRecords($machineId: String!) {
    machineUnregisterRecords(
      where: { 
        machineId: $machineId
        isActive: true 
      }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      machineId
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// 接口定义
export interface MachineUnregisterRecord {
  id: string;
  machineId: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface MachineUnregisterData {
  machineUnregisterRecords: MachineUnregisterRecord[];
}

// 处理后的记录类型
export interface ProcessedUnregisterRecord {
  id: string;
  machineId: string;
  blockNumber: string;
  blockTimestamp: string;
  formattedTime: string;
  transactionHash: string;
}

// 格式化时间戳
function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleString('zh-CN');
}

// 获取机器注销注册记录
export async function fetchMachineUnregisterRecords(machineId: string): Promise<ProcessedUnregisterRecord[]> {
  try {
    console.log('🔍 Machine Unregister Query Debug:');
    console.log('Query:', GET_MACHINE_UNREGISTER_RECORDS);
    console.log('Variables:', { machineId });
    console.log('Endpoint:', graphEndpoint);

    const response = await fetch(graphEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_MACHINE_UNREGISTER_RECORDS,
        variables: { machineId },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('GraphQL Response:', result);

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
    }

    const data: MachineUnregisterData = result.data;
    
    if (!data || !data.machineUnregisterRecords) {
      console.warn('No unregister records found for machine:', machineId);
      return [];
    }

    // 处理数据
    const processedRecords: ProcessedUnregisterRecord[] = data.machineUnregisterRecords.map(record => ({
      ...record,
      formattedTime: formatTimestamp(record.blockTimestamp),
    }));

    console.log('Processed unregister records:', processedRecords);
    return processedRecords;
  } catch (error) {
    console.error('Error fetching machine unregister records:', error);
    throw error;
  }
}