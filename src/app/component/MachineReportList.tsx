'use client';

import { useEffect } from 'react';
import { Card, Table, Tag, Spin, Alert, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  ProcessedReportRecord, 
  formatDuration 
} from '@/app/graphql/machineReportQuery';
import { useMachineReportStore } from '@/app/stores/machineReportStore';

interface MachineReportListProps {
  machineId: string;
}

export default function MachineReportList({ machineId }: MachineReportListProps) {
  const {
    reportRecords,
    loading,
    error,
    currentlyOffline,
    setMachineId,
    fetchData
  } = useMachineReportStore();

  // 格式化交易hash为可点击链接
  const formatTxHash = (hash: string | undefined) => {
    if (!hash || hash === '0x0' || hash === ''|| hash === '0x') return '-';
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
  };

  useEffect(() => {
    if (machineId) {
      setMachineId(machineId);
      fetchData();
    }
  }, [machineId, setMachineId, fetchData]);

  const columns: ColumnsType<ProcessedReportRecord> = [
    {
      title: '离线时间',
      dataIndex: 'offlineTime',
      key: 'offlineTime',
      render: (time: Date) => time.toLocaleString('zh-CN'),
    },
    {
      title: '重新上线时间',
      dataIndex: 'reOnlineTime',
      key: 'reOnlineTime',
      render: (time: Date | undefined) => time ? time.toLocaleString('zh-CN') : '-',
    },
    {
      title: '解质押时间',
      dataIndex: 'unStakeTime',
      key: 'unStakeTime',
      render: (time: Date | undefined) => time ? time.toLocaleString('zh-CN') : '-',
    },
    {
      title: '离线持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: string) => formatDuration(duration),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'offline' | 'online' | 'unstaked') => {
        const statusConfig = {
          offline: { text: '离线中', color: 'red' },
          online: { text: '已上线', color: 'green' },
          unstaked: { text: '已解质押', color: 'blue' },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '结束方式',
      key: 'finishType',
      render: (record: ProcessedReportRecord) => {
        if (record.finishedByEndStake) {
          return <Tag color="blue">解质押结束</Tag>;
        } else if (record.finishedByReOnline) {
          return <Tag color="green">重新上线结束</Tag>;
        } else {
          return <Tag color="orange">进行中</Tag>;
        }
      },
    },
    {
      title: '离线交易Hash链接',
      dataIndex: 'offlineTransactionHash',
      key: 'offlineTransactionHash',
      render: formatTxHash,
    },
    {
      title: '上线交易Hash链接',
      dataIndex: 'reOnlineTransactionHash',
      key: 'reOnlineTransactionHash',
      render: formatTxHash,
    },
    {
      title: '解质押交易Hash链接',
      dataIndex: 'unStakeTransactionHash',
      key: 'unStakeTransactionHash',
      render: formatTxHash,
    },
  ];

  if (loading) {
    return (
      <Card title="机器举报记录" style={{ marginTop: '20px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '10px' }}>加载举报记录中...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="机器举报记录" style={{ marginTop: '20px' }}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>机器举报记录</span>
          {currentlyOffline && (
            <Tag color="red">当前离线中</Tag>
          )}
        </div>
      } 
      style={{ marginTop: '20px' }}
    >
      {reportRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          暂无举报记录
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            共 {reportRecords.length} 条记录
            {currentlyOffline && (
              <span style={{ marginLeft: '10px', color: '#ff4d4f' }}>
                • 机器当前因举报而离线，尚未恢复
              </span>
            )}
          </div>
          <Table
            columns={columns}
            dataSource={reportRecords}
            rowKey={(record) => record.offlineTransactionHash || record.id}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
            scroll={{ x: 1520 }}
            size="middle"
          />
        </>
      )}
    </Card>
  );
}