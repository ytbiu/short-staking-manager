import { graphEndpoint } from '../const/const';

// GraphQL查询 - 不带任何过滤
const GET_ALL_RENTING_MACHINES = `
  query GetAllRentingMachines($limit: Int!, $offset: Int!) {
    rentingRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
      }
      orderBy: rentId
      orderDirection: desc
    ) {
      id
      machineOwner
      rentId
      machineId
      isActive
    }
    totalCount: rentingRecords(
      where: { 
        isActive: true
      }
    ) {
      id
    }
  }
`;

// GraphQL查询 - 按机器ID搜索
const GET_RENTING_MACHINES_BY_MACHINE_ID = `
  query GetRentingMachinesByMachineId($limit: Int!, $offset: Int!, $machineId: String!) {
    rentingRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
        machineId_contains: $machineId
      }
      orderBy: rentId
      orderDirection: desc
    ) {
      id
      machineOwner
      rentId
      machineId
      isActive
    }
    totalCount: rentingRecords(
      where: { 
        isActive: true
        machineId_contains: $machineId
      }
    ) {
      id
    }
  }
`;

// GraphQL查询 - 按机器所有者搜索
const GET_RENTING_MACHINES_BY_OWNER = `
  query GetRentingMachinesByOwner($limit: Int!, $offset: Int!, $machineOwner: String!) {
    rentingRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
        machineOwner_contains: $machineOwner
      }
      orderBy: rentId
      orderDirection: desc
    ) {
      id
      machineOwner
      rentId
      machineId
      isActive
    }
    totalCount: rentingRecords(
      where: { 
        isActive: true
        machineOwner_contains: $machineOwner
      }
    ) {
      id
    }
  }
`;

// GraphQL查询 - 按机器ID和所有者搜索
const GET_RENTING_MACHINES_BY_MACHINE_ID_AND_OWNER = `
  query GetRentingMachinesByMachineIdAndOwner($limit: Int!, $offset: Int!, $machineId: String!, $machineOwner: String!) {
    rentingRecords(
      first: $limit
      skip: $offset
      where: { 
        isActive: true
        machineId_contains: $machineId
        machineOwner_contains: $machineOwner
      }
      orderBy: rentId
      orderDirection: desc
    ) {
      id
      machineOwner
      rentId
      machineId
      isActive
    }
    totalCount: rentingRecords(
      where: { 
        isActive: true
        machineId_contains: $machineId
        machineOwner_contains: $machineOwner
      }
    ) {
      id
    }
  }
`;

export interface RentingRecord {
  id: string;
  machineOwner: string;
  rentId: string;
  machineId: string;
  isActive: boolean;
}

export interface ProcessedRentingRecord {
  id: string;
  machineOwner: string;
  rentId: string;
  machineId: string;
  isActive: boolean;
}

export interface RentingSearchFilters {
  machineId?: string;
  machineOwner?: string;
}

export interface RentingMachineData {
  rentingRecords: RentingRecord[];
  totalCount: { id: string }[];
}

export interface RentingMachinesResponse {
  machines: ProcessedRentingRecord[];
  total: number;
}

function processRentingRecord(record: RentingRecord): ProcessedRentingRecord {
  return {
    id: record.id,
    machineOwner: record.machineOwner,
    rentId: record.rentId,
    machineId: record.machineId,
    isActive: record.isActive
  };
}

export async function fetchRentingMachines(
  filters?: RentingSearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<RentingMachinesResponse> {
  try {
    const machineId = filters?.machineId?.trim();
    const machineOwner = filters?.machineOwner?.trim();
    
    // 根据搜索条件选择合适的查询
    let query: string;
    const variables: Record<string, string | number> = { limit, offset };
    
    if (machineId && machineOwner) {
      query = GET_RENTING_MACHINES_BY_MACHINE_ID_AND_OWNER;
      variables.machineId = machineId;
      variables.machineOwner = machineOwner;
    } else if (machineId) {
      query = GET_RENTING_MACHINES_BY_MACHINE_ID;
      variables.machineId = machineId;
    } else if (machineOwner) {
      query = GET_RENTING_MACHINES_BY_OWNER;
      variables.machineOwner = machineOwner;
    } else {
      query = GET_ALL_RENTING_MACHINES;
    }
    
    console.log('Executing GraphQL query:', query);
    console.log('With variables:', variables);
    
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
    }
    
    const data: RentingMachineData = result.data;
    
    if (!data || !data.rentingRecords) {
      console.warn('No renting records found in response');
      return {
        machines: [],
        total: 0
      };
    }
    
    const processedMachines = data.rentingRecords.map(processRentingRecord);
    const total = data.totalCount?.length || 0;
    
    console.log(`Fetched ${processedMachines.length} renting machines, total: ${total}`);
    
    return {
      machines: processedMachines,
      total
    };
  } catch (error) {
    console.error('Error fetching renting machines:', error);
    throw error;
  }
}