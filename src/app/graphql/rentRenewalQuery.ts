import { graphEndpoint } from '../const/const';

// 续租记录实体类型定义
export interface RentRenewal {
  id: string; // transaction hash
  machineOwner: string; // address
  machineId: string;
  rentId: string; // BigInt as string
  additionalRentSeconds: string; // BigInt as string
  additionalRentFee: string; // BigInt as string
  renter: string; // address
  blockNumber: string; // BigInt as string
  blockTimestamp: string; // BigInt as string
  transactionHash: string;
}

// 处理后的续租记录类型
export interface ProcessedRentRenewal {
  id: string;
  machineOwner: string;
  machineId: string;
  rentId: string;
  additionalRentSeconds: string;
  additionalRentFee: string;
  renter: string;
  blockNumber: string;
  formattedTimestamp: string;
  transactionHash: string;
  formattedAdditionalRentFee: string;
  formattedAdditionalRentSeconds: string;
}

// GraphQL查询：根据rentId获取续租记录
const GET_RENT_RENEWALS_BY_RENT_ID = `
  query GetRentRenewalsByRentId($rentId: BigInt!) {
    rentRenewals(where: { rentId: $rentId }, orderBy: blockTimestamp, orderDirection: desc) {
      id
      machineOwner
      machineId
      rentId
      additionalRentSeconds
      additionalRentFee
      renter
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// 时间戳格式化函数
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '无效时间';
  }
};

// 格式化续租费用（假设单位为wei，转换为DBC）
const formatRentFee = (fee: string): string => {
  try {
    const feeInDBC = parseFloat(fee) / Math.pow(10, 18);
    return `${feeInDBC.toFixed(6)} DBC`;
  } catch {
    return '0 DBC';
  }
};

// 格式化续租时长（秒转换为天、小时、分钟）
const formatRentSeconds = (seconds: string): string => {
  try {
    const totalSeconds = parseInt(seconds);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  } catch {
    return '0分钟';
  }
};

// 处理续租记录数据
const processRentRenewal = (renewal: RentRenewal): ProcessedRentRenewal => {
  return {
    ...renewal,
    formattedTimestamp: formatTimestamp(renewal.blockTimestamp),
    formattedAdditionalRentFee: formatRentFee(renewal.additionalRentFee),
    formattedAdditionalRentSeconds: formatRentSeconds(renewal.additionalRentSeconds),
  };
};

// 获取续租记录的函数
export const fetchRentRenewalsByRentId = async (rentId: string): Promise<ProcessedRentRenewal[]> => {
  try {
    console.log(`=== 续租记录查询开始 ===`);
    console.log(`查询参数 rentId: ${rentId}`);
    console.log(`GraphQL端点: ${graphEndpoint}`);
    
    const queryVariables = { rentId };
    console.log(`完整查询语句:`);
    console.log(GET_RENT_RENEWALS_BY_RENT_ID);
    console.log(`查询变量:`, JSON.stringify(queryVariables, null, 2));
    
    const requestBody = {
      query: GET_RENT_RENEWALS_BY_RENT_ID,
      variables: queryVariables,
    };
    console.log(`请求体:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(graphEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`HTTP响应状态: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`GraphQL响应结果:`, JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('GraphQL查询错误:', result.errors);
      throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
    }
    
    const renewals: RentRenewal[] = result.data?.rentRenewals || [];
    console.log(`查询到 ${renewals.length} 条续租记录`);
    
    if (renewals.length === 0) {
      console.warn(`警告: rentId ${rentId} 没有找到任何续租记录`);
    } else {
      console.log(`续租记录详情:`, renewals);
    }
    
    console.log(`=== 续租记录查询结束 ===`);
    
    return renewals.map(processRentRenewal);
  } catch (error) {
    console.error('=== 获取续租记录失败 ===');
    console.error('错误详情:', error);
    console.error('=== 错误结束 ===');
    throw error;
  }
};