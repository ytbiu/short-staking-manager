import { graphEndpoint } from '../const/const';

// GraphQL查询 - 获取特定机器的租用记录
const GET_MACHINE_RENT_RECORDS = `
  query GetMachineRentRecords($machineId: String!) {
    rentMachineRecords(
      where: { machineId: $machineId }
      orderBy: rentBlockTimestamp
      orderDirection: desc
    ) {
      id
      machineOwner
      rentId
      machineId
      rentEndTime
      renter
      gogoing
      rentBlockTimestamp
      rentTransactionHash
      endRentBlockTimestamp
      endRentTransactionHash
    }
  }
`;

export interface RentMachineRecord {
  id: string;
  machineOwner: string;
  rentId: string;
  machineId: string;
  rentEndTime: string;
  renter: string;
  gogoing: boolean;
  rentBlockTimestamp: string;
  rentTransactionHash: string;
  endRentBlockTimestamp: string;
  endRentTransactionHash: string;
}

export interface ProcessedRentRecord {
  id: string;
  machineOwner: string;
  rentId: string;
  machineId: string;
  rentEndTime: string;
  formattedRentEndTime: string;
  renter: string;
  gogoing: boolean;
  rentBlockTimestamp: string;
  formattedRentTime: string;
  rentTransactionHash: string;
  endRentBlockTimestamp: string;
  formattedEndRentTime: string;
  endRentTransactionHash: string;
  status: string;
}

// 格式化时间戳
function formatTimestamp(timestamp: string): string {
  if (!timestamp || timestamp === '0') return '-';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('zh-CN');
}

// 处理租用记录
function processRentRecord(record: RentMachineRecord): ProcessedRentRecord {
  const formattedRentTime = formatTimestamp(record.rentBlockTimestamp);
  const formattedEndRentTime = formatTimestamp(record.endRentBlockTimestamp);
  const formattedRentEndTime = formatTimestamp(record.rentEndTime);
  
  // 确定租用状态
  let status = '已结束';
  if (record.gogoing) {
    status = '租用中';
  }
  
  return {
    ...record,
    formattedRentTime,
    formattedEndRentTime,
    formattedRentEndTime,
    status
  };
}

export async function fetchMachineRentRecords(machineId: string): Promise<ProcessedRentRecord[]> {
  try {
    console.log(`Fetching rent records for machine: ${machineId}`);
    
    const response = await fetch(graphEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_MACHINE_RENT_RECORDS,
        variables: { machineId },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
    }
    
    const records: RentMachineRecord[] = result.data?.rentMachineRecords || [];
    console.log(`Found ${records.length} rent records for machine ${machineId}`);
    
    return records.map(processRentRecord);
  } catch (error) {
    console.error('Error fetching machine rent records:', error);
    throw error;
  }
}