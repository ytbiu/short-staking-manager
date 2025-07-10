import { graphEndpoint } from '../const/const';

// GraphQL查询
const GET_MACHINE_SLASHED_RECORDS = `
  query GetMachineSlashedRecords($machineId: String!) {
    machineSlashedRecords(
      where: { 
        machineId: $machineId
      }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      machineId
      holder
      renter
      slashAmount
      slashType
      rentStatTime
      rentEndTime
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// 类型定义
export interface MachineSlashedRecord {
  id: string;
  machineId: string;
  holder: string;
  renter: string;
  slashAmount: string;
  slashType: string;
  rentStatTime: string;
  rentEndTime: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface MachineSlashedData {
  machineSlashedRecords: MachineSlashedRecord[];
}

export interface ProcessedSlashedRecord {
  id: string;
  machineId: string;
  holder: string;
  renter: string;
  slashAmount: string;
  slashType: string;
  rentStartTime: Date;
  rentEndTime: Date;
  slashTime: Date;
  transactionHash: string;
}

// 获取机器惩罚记录
export async function fetchMachineSlashedRecords(machineId: string): Promise<ProcessedSlashedRecord[]> {
  try {
    // Debug: 打印GraphQL查询信息
    console.log('🔍 Machine Slashed Query Debug:');
    console.log('Query:', GET_MACHINE_SLASHED_RECORDS);
    console.log('Variables:', { machineId });
    console.log('Endpoint:', graphEndpoint);

    const response = await fetch(graphEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_MACHINE_SLASHED_RECORDS,
        variables: { machineId },
      }),
    });

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Debug: 打印GraphQL响应
    console.log('📥 Machine Slashed Response:');
    console.log('Full result:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const data: MachineSlashedData = result.data;
    
    // Debug: 打印数据统计
    console.log('📊 Slashed Data Statistics:');
    console.log('Records count:', data?.machineSlashedRecords?.length || 0);
    if (data?.machineSlashedRecords?.length > 0) {
      console.log('First record:', data.machineSlashedRecords[0]);
    }
    
    // 处理数据
    return processSlashedRecords(data.machineSlashedRecords);
  } catch (error) {
    console.error('Error fetching machine slashed records:', error);
    throw error;
  }
}

// 处理惩罚记录
function processSlashedRecords(
  slashedRecords: MachineSlashedRecord[]
): ProcessedSlashedRecord[] {
  return slashedRecords.map(record => {
    const rentStartTime = new Date(parseInt(record.rentStatTime) * 1000);
    const rentEndTime = new Date(parseInt(record.rentEndTime) * 1000);
    const slashTime = new Date(parseInt(record.blockTimestamp) * 1000);
    
    return {
      id: record.id,
      machineId: record.machineId,
      holder: record.holder,
      renter: record.renter,
      slashAmount: record.slashAmount,
      slashType: record.slashType,
      rentStartTime,
      rentEndTime,
      slashTime,
      transactionHash: record.transactionHash,
    };
  });
}

// 格式化惩罚金额（从wei转换为ETH）
export function formatSlashAmount(amountWei: string): string {
  const amount = BigInt(amountWei);
  const eth = Number(amount) / Math.pow(10, 18);
  return `${eth.toFixed(6)} ETH`;
}

// 格式化地址（显示前6位和后4位）
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// 格式化惩罚类型
export function formatSlashType(slashType: string): string {
  const type = parseInt(slashType);
  switch (type) {
    case 1:
      return '离线惩罚';
    case 2:
      return '性能惩罚';
    case 3:
      return '恶意行为惩罚';
    default:
      return `未知类型(${type})`;
  }
}