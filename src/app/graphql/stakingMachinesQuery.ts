import { graphEndpoint } from "../const/const";

// 基础查询，不包含搜索条件
export const stakingMachinesQueryBase = `
query GetStakingMachines($limit: Int!, $offset: Int!, $orderBy: String!, $sort: String!) {
   machineInfos(
      first: $limit
      skip: $offset
      where:{
        isStaking:true
      }
      orderBy: $orderBy,orderDirection:$sort)
    {
      machineId
      holder
      extraRentFee
      totalClaimedRewardAmount
      burnedRentFee
      totalReservedAmount
      isRented
      online
      registered
    }
    totalCount: machineInfos(
      first: 1000
      where:{
        isStaking:true
      }
    ) {
      id
    }
}
`;

// 动态构建查询函数
function buildGraphQLQuery(hasMachineId: boolean, hasHolder: boolean, hasIsRented: boolean, hasIsOnline: boolean, hasRegistered: boolean): string {
  let whereClause = `
        isStaking:true`;
  
  if (hasMachineId) {
    whereClause += `
        machineId_contains: $machineId`;
  }
  
  if (hasHolder) {
    whereClause += `
        holder_contains: $holder`;
  }
  
  if (hasIsRented) {
    whereClause += `
        isRented: $isRented`;
  }
  
  if (hasIsOnline) {
    whereClause += `
        online: $online`;
  }
  
  if (hasRegistered) {
    whereClause += `
        registered: $registered`;
  }
  
  const variableDeclarations = [
    '$limit: Int!',
    '$offset: Int!', 
    '$orderBy: String!',
    '$sort: String!'
  ];
  
  if (hasMachineId) {
    variableDeclarations.push('$machineId: String!');
  }
  
  if (hasHolder) {
    variableDeclarations.push('$holder: String!');
  }
  
  if (hasIsRented) {
    variableDeclarations.push('$isRented: Boolean!');
  }
  
  if (hasIsOnline) {
    variableDeclarations.push('$online: Boolean!');
  }
  
  if (hasRegistered) {
    variableDeclarations.push('$registered: Boolean!');
  }
  
  return `
query GetStakingMachines(${variableDeclarations.join(', ')}) {
   machineInfos(
      first: $limit
      skip: $offset
      where:{${whereClause}
      }
      orderBy: $orderBy,orderDirection:$sort)
    {
      machineId
      holder
      extraRentFee
      totalClaimedRewardAmount
      burnedRentFee
      totalReservedAmount
      isRented
      online
      registered
    }
    totalCount: machineInfos(
      first: 1000
      where:{${whereClause}
      }
    ) {
      id
    }
}
`;
}

export const stakingMachinesQuery = stakingMachinesQueryBase;

export type StakingMachine = {
  machineId: string;
  holder: string;
  extraRentFee: string;
  totalClaimedRewardAmount: string;
  burnedRentFee: string;
  totalReservedAmount: string;
  isRented: boolean;
  online: boolean;
  registered: boolean;
};

type RawStakingMachine = {
  machineId: string;
  holder: string;
  extraRentFee: string;
  totalClaimedRewardAmount: string;
  burnedRentFee: string;
  totalReservedAmount: string;
  isRented: boolean;
  online: boolean;
  registered: boolean;
};

export interface SearchFilters {
  machineId?: string;
  holder?: string;
  isRented?: boolean;
  online?: boolean;
  registered?: boolean;
}

export interface StakingMachinesResponse {
  machines: StakingMachine[];
  total: number;
}

export async function fetchStakingMachines(
  pageNo: number,
  pageSize: number,
  orderBy: string,
  sort: string,
  filters: SearchFilters = {}
): Promise<StakingMachinesResponse> {
  // 检查具体的搜索条件
  const hasMachineId = !!(filters.machineId && filters.machineId.trim());
  const hasHolder = !!(filters.holder && filters.holder.trim());
  const hasIsRented = filters.isRented !== undefined;
  const hasIsOnline = filters.online !== undefined;
  const hasRegistered = filters.registered !== undefined;
  const hasAnyFilters = hasMachineId || hasHolder || hasIsRented || hasIsOnline || hasRegistered;
  
  // 动态构建查询
  const queryToUse = hasAnyFilters 
    ? buildGraphQLQuery(hasMachineId, hasHolder, hasIsRented, hasIsOnline, hasRegistered)
    : stakingMachinesQueryBase;
  
  console.log("Fetching with filters:", filters);
  console.log("Has machineId filter:", hasMachineId);
  console.log("Has holder filter:", hasHolder);
  console.log("Has isRented filter:", hasIsRented);
  console.log("Has online filter:", hasIsOnline);
  console.log("Has registered filter:", hasRegistered);
  
  // 构建变量对象
  const baseVariables = {
    limit: pageSize,
    offset: (pageNo - 1) * pageSize,
    orderBy,
    sort,
  };
  
  // 只添加非空的搜索条件
  const variables: Record<string, string | number | boolean> = { ...baseVariables };
  if (hasMachineId && filters.machineId) {
    variables.machineId = filters.machineId;
  }
  if (hasHolder && filters.holder) {
    variables.holder = filters.holder;
  }
  if (hasIsRented && filters.isRented !== undefined) {
    variables.isRented = filters.isRented;
  }
  if (hasIsOnline && filters.online !== undefined) {
    variables.online = filters.online;
  }
  if (hasRegistered && filters.registered !== undefined) {
    variables.registered = filters.registered;
  }
    
  console.log("Query variables:", variables);
  console.log("Generated query:", queryToUse);

  const response = await fetch(graphEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: queryToUse,
      variables,
    }),
  });

  const data = await response.json();
  console.log("GraphQL Response:", data);
  
  // 检查是否有错误
  if (data.errors) {
    console.error("GraphQL Errors:", data.errors);
    throw new Error(`GraphQL Error: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }
  
  // 检查数据是否存在
  if (!data.data || !data.data.machineInfos) {
    console.warn("No machineInfos data found:", data);
    return { machines: [], total: 0 };
  }
  
  const processedMachines: StakingMachine[] = data.data.machineInfos.map(
    (item: RawStakingMachine) => ({
      machineId: item.machineId,
      holder: item.holder,
      extraRentFee: (BigInt(item.extraRentFee) / BigInt(1e18)).toString(),
      totalClaimedRewardAmount: (
        BigInt(item.totalClaimedRewardAmount) / BigInt(1e18)
      ).toString(),
      burnedRentFee: (BigInt(item.burnedRentFee) / BigInt(1e18)).toString(),
      totalReservedAmount: (
        BigInt(item.totalReservedAmount) / BigInt(1e18)
      ).toString(),
      isRented: item.isRented,
      online: item.online,
      registered: item.registered,
    })
  );
  
  // 获取总数量
  const totalCount = data.data.totalCount ? data.data.totalCount.length : 0;
  
  console.log(`Processed ${processedMachines.length} machines, total: ${totalCount}`);
  return { machines: processedMachines, total: totalCount };
}