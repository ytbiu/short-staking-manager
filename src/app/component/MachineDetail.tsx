'use client';

import { useState, useEffect } from 'react';
import { Card, Spin, Alert, Tag } from 'antd';
import { viemClient, CONTRACT_CONFIG } from '@/app/config/viem';

interface ContractData {
  canRent: boolean;
  reason: string;
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

interface MachineDetailProps {
  machineId: string;
}

export default function MachineDetail({ machineId }: MachineDetailProps) {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行调用两个合约函数
        const [canRentResult, reasonResult] = await Promise.all([
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
        ]);

        setContractData({
          canRent: canRentResult as boolean,
          reason: reasonResult as string,
        });
      } catch (err) {
        console.error('合约调用失败:', err);
        setError(err instanceof Error ? err.message : '合约调用失败');
      } finally {
        setLoading(false);
      }
    };

    if (machineId) {
      fetchContractData();
    }
  }, [machineId]);

  return (
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
  );
}