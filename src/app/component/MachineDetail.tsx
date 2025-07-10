'use client';

import { useState, useEffect } from 'react';
import { Card, Spin, Alert, Tag, Descriptions, Table, Tooltip } from 'antd';
import { viemClient, CONTRACT_CONFIG, MACHINE_INFO_CONTRACT_CONFIG } from '../config/viem';
import { fetchMachineUnregisterRecords, ProcessedUnregisterRecord } from '../graphql/machineUnregisterQuery';

interface ContractData {
  canRent: boolean;
  reason: string;
  inWhiteList: boolean;
}

interface MachineInfo {
  holder: string;
  calcPoint: bigint;
  startAtTimestamp: bigint;
  endAtTimestamp: bigint;
  nextRenterCanRentAt: bigint;
  reservedAmount: bigint;
  isOnline: boolean;
  isRegistered: boolean;
}

// 英文错误信息到中文的映射
const reasonTranslations: Record<string, string> = {
  "not in rent whitelist": "不在租赁白名单中",
  "is rented": "已被租赁",
  "not in staking": "未参与质押",
  "is blocked(in blacklist)": "已被拉黑",
  "is staking but offline": "质押中但离线",
  "not enough staking duration": "质押时长不足",
  "is offline": "设备离线",
  "not registered": "未注册",
  "can not rent before next renter can rent time": "尚未到达可租赁时间",
  "machine staking time less than 1 hours": "机器质押时间少于1小时",
};

// 翻译函数
const translateReason = (reason: string): string => {
  return reasonTranslations[reason] || reason;
};

// 格式化时间戳
const formatTimestamp = (timestamp: bigint): string => {
  if (timestamp === BigInt(0)) return '未设置';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('zh-CN');
};

// 格式化金额（从wei转换为DLC）
const formatAmount = (amount: bigint): string => {
  if (amount === BigInt(0)) return '0 DLC';
  const dlc = Number(amount) / Math.pow(10, 18);
  return `${Math.floor(dlc)} DLC`;
};

// 格式化地址
const formatAddress = (address: string): string => {
  if (!address || address === '0x0000000000000000000000000000000000000000') return '未设置';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface MachineDetailProps {
  machineId: string;
}

export default function MachineDetail({ machineId }: MachineDetailProps) {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [machineInfoError, setMachineInfoError] = useState<string | null>(null);
  const [machineInfoLoading, setMachineInfoLoading] = useState(true);
  const [unregisterRecords, setUnregisterRecords] = useState<ProcessedUnregisterRecord[]>([]);
  const [unregisterLoading, setUnregisterLoading] = useState(true);
  const [unregisterError, setUnregisterError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行调用三个合约函数
        const [canRentResult, reasonResult, whiteListResult] = await Promise.all([
          viemClient.readContract({
            address: CONTRACT_CONFIG.address,
            abi: CONTRACT_CONFIG.abi,
            functionName: 'canRent',
            args: [machineId],
          }),
          viemClient.readContract({
            address: CONTRACT_CONFIG.address,
            abi: CONTRACT_CONFIG.abi,
            functionName: 'resonFoCanNotRent',
            args: [machineId],
          }),
          viemClient.readContract({
            address: CONTRACT_CONFIG.address,
            abi: CONTRACT_CONFIG.abi,
            functionName: 'inRentWhiteList',
            args: [machineId],
          }),
        ]);

        setContractData({
          canRent: canRentResult as boolean,
          reason: reasonResult as string,
          inWhiteList: whiteListResult as boolean,
        });
      } catch (err) {
        console.error('合约调用失败:', err);
        setError(err instanceof Error ? err.message : '合约调用失败');
      } finally {
        setLoading(false);
      }
    };

    const fetchMachineInfo = async () => {
      try {
        setMachineInfoLoading(true);
        setMachineInfoError(null);

        // 先测试一个简单的合约调用来验证连接
        console.log('Testing contract connection with canRent...');
        const canRentTest = await viemClient.readContract({
          address: CONTRACT_CONFIG.address,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'canRent',
          args: [machineId],
        });
        console.log('canRent test result:', canRentTest);

        // 使用正确的机器信息合约调用getMachineInfo
        console.log('Calling getMachineInfo with machineId:', machineId);
        const result = await viemClient.readContract({
          address: MACHINE_INFO_CONTRACT_CONFIG.address,
          abi: MACHINE_INFO_CONTRACT_CONFIG.abi,
          functionName: 'getMachineInfo',
          args: [machineId],
        });

        console.log('getMachineInfo raw result:', result);
        
        // 检查返回结果的类型和长度
        if (!Array.isArray(result)) {
          throw new Error(`Expected array result, got: ${typeof result}`);
        }
        
        if (result.length !== 8) {
          throw new Error(`Expected 8 return values, got: ${result.length}`);
        }

        const [holder, calcPoint, startAtTimestamp, endAtTimestamp, nextRenterCanRentAt, reservedAmount, isOnline, isRegistered] = result as [string, bigint, bigint, bigint, bigint, bigint, boolean, boolean];

        setMachineInfo({
          holder,
          calcPoint,
          startAtTimestamp,
          endAtTimestamp,
          nextRenterCanRentAt,
          reservedAmount,
          isOnline,
          isRegistered,
        });
        
        console.log('Machine info fetched successfully');
      } catch (err) {
        console.error('获取机器信息失败:', err);
        setMachineInfoError(err instanceof Error ? err.message : '获取机器信息失败');
      } finally {
        setMachineInfoLoading(false);
      }
    };

    const fetchUnregisterRecords = async () => {
      try {
        setUnregisterLoading(true);
        setUnregisterError(null);
        const records = await fetchMachineUnregisterRecords(machineId);
        setUnregisterRecords(records);
      } catch (err) {
        console.error('获取注销注册记录失败:', err);
        setUnregisterError(err instanceof Error ? err.message : '获取注销注册记录失败');
      } finally {
        setUnregisterLoading(false);
      }
    };

    if (machineId) {
      fetchContractData();
      fetchMachineInfo();
      fetchUnregisterRecords();
    }
  }, [machineId]);

  return (
    <div>
      {/* 机器详细信息 */}
      <Card title="机器详细信息" loading={machineInfoLoading} style={{ marginBottom: '20px' }}>
        {machineInfoError ? (
          <Alert
            message="获取机器信息失败"
            description={machineInfoError}
            type="error"
            showIcon
          />
        ) : machineInfo ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="持有者地址" span={2}>
              <span title={machineInfo.holder}>{formatAddress(machineInfo.holder)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="算力点数">
              {machineInfo.calcPoint.toString()}
            </Descriptions.Item>
            <Descriptions.Item label="质押金额">
              {formatAmount(machineInfo.reservedAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="质押开始时间">
              {formatTimestamp(machineInfo.startAtTimestamp)}
            </Descriptions.Item>
            <Descriptions.Item label="质押结束时间">
              {formatTimestamp(machineInfo.endAtTimestamp)}
            </Descriptions.Item>
            <Descriptions.Item label="下次可租赁时间">
              {formatTimestamp(machineInfo.nextRenterCanRentAt)}
            </Descriptions.Item>
            <Descriptions.Item label="机器状态">
              <Tag color={machineInfo.isOnline ? 'green' : 'red'} style={{ marginRight: '8px', fontSize: '12px' }}>
                {machineInfo.isOnline ? '在线' : '离线'}
              </Tag>
              <Tag color={machineInfo.isRegistered ? 'blue' : 'orange'} style={{ fontSize: '12px' }}>
                {machineInfo.isRegistered ? '已注册' : '未注册'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Spin tip="正在获取机器信息..." />
        )}
      </Card>

      {/* 租赁状态 */}
      <Card title="租赁状态" loading={loading}>
        {error ? (
          <Alert
            message="获取租赁状态失败"
            description={error}
            type="error"
            showIcon
          />
        ) : contractData ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong>是否可租赁: </strong>
              <Tag color={contractData.canRent ? 'green' : 'red'}>
                {contractData.canRent ? '可租赁' : '不可租赁'}
              </Tag>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>白名单状态: </strong>
              <Tag color={contractData.inWhiteList ? 'blue' : 'orange'}>
                {contractData.inWhiteList ? '在白名单中' : '不在白名单中'}
              </Tag>
            </div>
            {!contractData.canRent && contractData.reason && (
                <div>
                  <strong>不可租赁原因: </strong>
                  <span style={{ color: '#ff4d4f' }}>{translateReason(contractData.reason)}</span>
                </div>
              )}
          </div>
        ) : (
          <Spin tip="正在获取租赁状态..." />
        )}
      </Card>

      {/* 当前注销注册记录 */}
      <Card title="当前注销注册记录" loading={unregisterLoading} style={{ marginTop: '20px' }}>
        {unregisterError ? (
          <Alert
            message="获取注销注册记录失败"
            description={unregisterError}
            type="error"
            showIcon
          />
        ) : (
          <Table
            dataSource={unregisterRecords}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              {
                title: '区块号',
                dataIndex: 'blockNumber',
                key: 'blockNumber',
                width: 120,
              },
              {
                title: '注销时间',
                dataIndex: 'formattedTime',
                key: 'formattedTime',
                width: 180,
              },
              {
                 title: '交易哈希',
                 dataIndex: 'transactionHash',
                 key: 'transactionHash',
                 render: (hash: string) => {
                   if (!hash || hash === '0x0' || hash === '') return '-';
                   const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
                   const txUrl = `https://dbcscan.io/zh/tx/${hash}`;
                   return (
                     <Tooltip title={`点击查看交易详情: ${hash}`}>
                       <a 
                         href={txUrl} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         style={{ color: '#1890ff', textDecoration: 'none' }}
                       >
                         {shortHash}
                       </a>
                     </Tooltip>
                   );
                 },
               },
            ]}
            locale={{
              emptyText: '暂无注销注册记录',
            }}
          />
        )}
      </Card>
    </div>
  );
}