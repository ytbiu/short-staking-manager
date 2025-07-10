'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, message, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  fetchMachineSlashedRecords,
  formatAddress,
  type ProcessedSlashedRecord
} from '../graphql/machineSlashedQuery';

interface MachineSlashedListProps {
  machineId: string;
}

const MachineSlashedList: React.FC<MachineSlashedListProps> = ({ machineId }) => {
  const [slashedRecords, setSlashedRecords] = useState<ProcessedSlashedRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 格式化交易Hash为可点击链接
  const formatTxHash = (hash: string) => {
    if (!hash) return '-';
    const shortHash = `${hash.slice(0, 8)}...${hash.slice(-6)}`;
    return (
      <Tooltip title={hash}>
        <a
          href={`https://dbcscan.io/zh/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1890ff' }}
        >
          {shortHash}
        </a>
      </Tooltip>
    );
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化惩罚金额为固定DLC
  const formatSlashAmountDLC = () => {
    return '1000 DLC';
  };

  // 格式化时间为简单格式
  const formatSimpleTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 表格列定义
  const columns: ColumnsType<ProcessedSlashedRecord> = [
    {
      title: '租用人地址',
      dataIndex: 'renter',
      key: 'renter',
      width: 140,
      render: (renter: string) => (
        <Tooltip title={renter}>
          <span>{formatAddress(renter)}</span>
        </Tooltip>
      ),
    },
    {
      title: '惩罚金额',
      dataIndex: 'slashAmount',
      key: 'slashAmount',
      width: 120,
      render: () => formatSlashAmountDLC(),
    },
    {
      title: '租用起始时间',
      dataIndex: 'rentStartTime',
      key: 'rentStartTime',
      width: 160,
      render: (time: Date) => formatTime(time),
    },
    {
      title: '租用结束时间',
      dataIndex: 'rentEndTime',
      key: 'rentEndTime',
      width: 160,
      render: (time: Date) => formatTime(time),
    },
    {
      title: '下线惩罚时间',
      dataIndex: 'slashTime',
      key: 'slashTime',
      width: 140,
      render: (time: Date) => formatSimpleTime(time),
    },
    {
      title: '交易Hash链接',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      width: 140,
      render: formatTxHash,
    },
  ];

  // 获取数据
  const fetchData = async () => {
    if (!machineId) return;
    
    setLoading(true);
    try {
      const records = await fetchMachineSlashedRecords(machineId);
      setSlashedRecords(records);
    } catch (error) {
      console.error('获取惩罚记录失败:', error);
      message.error('获取惩罚记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [machineId]);

  return (
    <Card 
      title="机器惩罚记录" 
      style={{ marginTop: 16 }}
    >
      {slashedRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          暂无惩罚记录
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            共 {slashedRecords.length} 条记录
          </div>
          <Table
        columns={columns}
        dataSource={slashedRecords}
        rowKey="transactionHash"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ x: 760 }}
            locale={{
              emptyText: '暂无惩罚记录'
            }}
          />
        </>
      )}
    </Card>
  );
};

export default MachineSlashedList;