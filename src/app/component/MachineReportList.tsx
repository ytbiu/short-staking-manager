'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Spin, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  fetchMachineReports, 
  ProcessedReportRecord, 
  isMachineCurrentlyOffline,
  formatDuration 
} from '@/app/graphql/machineReportQuery';

interface MachineReportListProps {
  machineId: string;
}

export default function MachineReportList({ machineId }: MachineReportListProps) {
  const [reportRecords, setReportRecords] = useState<ProcessedReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyOffline, setCurrentlyOffline] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const records = await fetchMachineReports(machineId);
        setReportRecords(records);
        setCurrentlyOffline(isMachineCurrentlyOffline(records));
      } catch (err) {
        console.error('获取举报记录失败:', err);
        setError(err instanceof Error ? err.message : '获取举报记录失败');
      } finally {
        setLoading(false);
      }
    };

    if (machineId) {
      fetchReports();
    }
  }, [machineId]);

  const columns: ColumnsType<ProcessedReportRecord> = [
    {
      title: '举报下线时间',
      dataIndex: 'offlineTime',
      key: 'offlineTime',
      width: 180,
    },
    {
      title: '恢复上线时间',
      dataIndex: 'reonlineTime',
      key: 'reonlineTime',
      width: 180,
      render: (reonlineTime: string | undefined) => (
        reonlineTime || <span style={{ color: '#999' }}>未恢复</span>
      ),
    },
    {
      title: '离线时长',
      key: 'duration',
      width: 120,
      render: (_, record) => {
        if (record.duration) {
          return formatDuration(record.duration);
        }
        return <span style={{ color: '#999' }}>进行中</span>;
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (record.status === 'offline') {
          return <Tag color="red">离线中</Tag>;
        } else {
          return <Tag color="green">已恢复</Tag>;
        }
      },
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
            rowKey={(record, index) => `${record.offlineEvent.blockTimestamp}-${index}`}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
            size="middle"
          />
        </>
      )}
    </Card>
  );
}