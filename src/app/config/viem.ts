import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem';

// 定义DBC链
export const dbcChain = defineChain({
  id: 1, // 临时ID，实际应该使用正确的链ID
  name: 'DBC Chain',
  network: 'dbc',
  nativeCurrency: {
    decimals: 18,
    name: 'DBC',
    symbol: 'DBC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.dbcwallet.io'],
    },
    public: {
      http: ['https://rpc.dbcwallet.io'],
    },
  },
});

// 创建公共客户端实例
export const viemClient = createPublicClient({
  chain: dbcChain,
  transport: http(),
});

// 合约配置
export const CONTRACT_CONFIG = {
  address: '0xDA9EfdfF9CA7B7065b7706406a1a79C0e483815A' as const,
  abi: [
    {
      inputs: [{ name: 'machineId', type: 'string' }],
      name: 'canRent',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'machineId', type: 'string' }],
      name: 'resonFoCanNotRent',
      outputs: [{ name: 'reson', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'machineId', type: 'string' }],
      name: 'inRentWhiteList',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const,
};