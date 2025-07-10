import { graphEndpoint } from '../const/const';

// GraphQL查询 - 不带任何过滤
const GET_ALL_OFFLINE_MACHINES = `
  query GetAllOfflineMachines($limit: Int!, $offset: Int!) {
    machineOfflineRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
      }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      machineId
      holder
      blockNumber
      blockTimestamp
      transactionHash
    }
    totalCount: machineOfflineRecords(
      first: 1000
      where: { 
        isActive: true
      }
    ) {
      id
    }
  }
`;

// GraphQL查询 - 带machineId过滤
const GET_MACHINE_ID_FILTERED = `
  query GetMachineIdFiltered($machineId: String!, $limit: Int!, $offset: Int!) {
    machineOfflineRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
        machineId_contains: $machineId
      }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      machineId
      holder
      blockNumber
      blockTimestamp
      transactionHash
    }
    totalCount: machineOfflineRecords(
      first: 1000
      where: { 
        isActive: true
        machineId_contains: $machineId
      }
    ) {
      id
    }
  }
`;

// GraphQL查询 - 带holder过滤
const GET_HOLDER_FILTERED = `
  query GetHolderFiltered($holder: String!, $limit: Int!, $offset: Int!) {
    machineOfflineRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
        holder_contains: $holder
      }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      machineId
      holder
      blockNumber
      blockTimestamp
      transactionHash
    }
    totalCount: machineOfflineRecords(
      first: 1000
      where: { 
        isActive: true
        holder_contains: $holder
      }
    ) {
      id
    }
  }
`;

// GraphQL查询 - 带machineId和holder双重过滤
const GET_DUAL_FILTERED = `
  query GetDualFiltered($machineId: String!, $holder: String!, $limit: Int!, $offset: Int!) {
    machineOfflineRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
        machineId_contains: $machineId
        holder_contains: $holder
      }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      machineId
      holder
      blockNumber
      blockTimestamp
      transactionHash
    }
    totalCount: machineOfflineRecords(
      first: 1000
      where: { 
        isActive: true
        machineId_contains: $machineId
        holder_contains: $holder
      }
    ) {
      id
    }
  }
`;

// 类型定义
export interface MachineOfflineRecord {
  id: string;
  machineId: string;
  holder: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  isActive: boolean;
}

export interface MachineOfflineData {
  machineOfflineRecords: MachineOfflineRecord[];
  totalCount: { id: string }[];
}

export interface OfflineMachinesResponse {
  machines: ProcessedOfflineRecord[];
  total: number;
}

export interface ProcessedOfflineRecord {
  id: string;
  machineId: string;
  holder: string;
  blockNumber: string;
  offlineTime: Date;
  transactionHash: string;
}

// 搜索过滤条件接口
export interface OfflineSearchFilters {
  machineId?: string;
  holder?: string;
}

// 获取离线机器记录
export async function fetchOfflineMachines(
  filters?: OfflineSearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<OfflineMachinesResponse> {
  try {
    const machineId = filters?.machineId?.trim();
    const holder = filters?.holder?.trim();
    
    // 根据搜索条件选择合适的查询
    let query: string;
    let variables: Record<string, string | number> = { limit, offset };
    
    if (machineId && holder) {
      // 双重过滤
      query = GET_DUAL_FILTERED;
      variables = { machineId, holder, limit, offset };
    } else if (machineId) {
      // 仅machineId过滤
      query = GET_MACHINE_ID_FILTERED;
      variables = { machineId, limit, offset };
    } else if (holder) {
      // 仅holder过滤
      query = GET_HOLDER_FILTERED;
      variables = { holder, limit, offset };
    } else {
      // 无过滤条件
      query = GET_ALL_OFFLINE_MACHINES;
      variables = { limit, offset };
    }

    // Debug: 打印GraphQL查询信息
    console.log('🔍 GraphQL Query Debug:');
    console.log('Query:', query);
    console.log('Variables:', variables);
    console.log('Endpoint:', graphEndpoint);

    const response = await fetch(graphEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Debug: 打印GraphQL响应
    console.log('📥 GraphQL Response:');
    console.log('Full result:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const data: MachineOfflineData = result.data;
    
    // Debug: 打印数据统计
    console.log('📊 Data Statistics:');
    console.log('Records count:', data?.machineOfflineRecords?.length || 0);
    if (data?.machineOfflineRecords?.length > 0) {
      console.log('First record:', data.machineOfflineRecords[0]);
    }
    
    // 处理数据
    const processedRecords = processOfflineRecords(data.machineOfflineRecords);
    
    return {
      machines: processedRecords,
      total: data.totalCount.length
    };
  } catch (error) {
    console.error('Error fetching offline machines:', error);
    return {
      machines: [],
      total: 0
    };
  }
}

// 处理离线记录
function processOfflineRecords(
  offlineRecords: MachineOfflineRecord[]
): ProcessedOfflineRecord[] {
  return offlineRecords.map(record => {
    const offlineTime = new Date(parseInt(record.blockTimestamp) * 1000);
    
    return {
      id: record.id,
      machineId: record.machineId,
      holder: record.holder,
      blockNumber: record.blockNumber,
      offlineTime,
      transactionHash: record.transactionHash,
    };
  });
}