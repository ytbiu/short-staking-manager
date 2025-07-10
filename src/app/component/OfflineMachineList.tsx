'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Alert, Spin, Tag, Tooltip, Form } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { fetchOfflineMachines, ProcessedOfflineRecord, OfflineSearchFilters } from '../graphql/offlineMachineQuery';

export default function OfflineMachineList() {
  const [offlineRecords, setOfflineRecords] = useState<ProcessedOfflineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<OfflineSearchFilters>({});
  const [searching, setSearching] = useState(false);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // 格式化地址显示
  const formatAddress = (address: string) => {
    if (!address) return '-';
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <Tooltip title={address}>
        <span style={{ cursor: 'pointer', color: '#1890ff' }}>
          {shortAddress}
        </span>
      </Tooltip>
    );
  };



  // 获取离线机器数据
  const fetchData = async (filters?: OfflineSearchFilters, page: number = currentPage, pageSize: number = currentPageSize) => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * pageSize;
      const response = await fetchOfflineMachines(filters, pageSize, offset);
      setOfflineRecords(response.machines);
      setTotal(response.total);
    } catch (err) {
      console.error('获取离线机器记录失败:', err);
      setError(err instanceof Error ? err.message : '获取离线机器记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = async (values: OfflineSearchFilters) => {
    setSearching(true);
    
    // 过滤掉空值
    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value && value.trim() !== '')
    );
    
    setSearchFilters(filteredValues);
    setCurrentPage(1); // 重置到第一页
    await fetchData(filteredValues, 1, currentPageSize);
    setSearching(false);
  };

  // 清除搜索
  const handleClearSearch = async () => {
    form.resetFields();
    setSearchFilters({});
    setCurrentPage(1); // 重置到第一页
    await fetchData({}, 1, currentPageSize);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnsType<ProcessedOfflineRecord> = [
    {
      title: '机器ID',
      dataIndex: 'machineId',
      key: 'machineId',
      width: 200,
      render: (machineId: string) => {
        const shortMachineId = `${machineId.slice(0, 8)}...${machineId.slice(-6)}`;
        return (
          <Tooltip title={`点击查看机器详情: ${machineId}`}>
            <Link 
              href={`/machine/detail/${machineId}`}
              style={{ 
                color: '#1890ff', 
                textDecoration: 'none',
                fontFamily: 'monospace', 
                fontSize: '12px'
              }}
            >
              {shortMachineId}
            </Link>
          </Tooltip>
        );
      },
    },
    {
      title: '持有者地址',
      dataIndex: 'holder',
      key: 'holder',
      width: 150,
      render: formatAddress,
    },
    {
      title: '区块号',
      dataIndex: 'blockNumber',
      key: 'blockNumber',
      width: 120,
      render: (blockNumber: string) => (
        <span style={{ fontFamily: 'monospace' }}>
          {parseInt(blockNumber).toLocaleString()}
        </span>
      ),
    },
    {
      title: '离线时间',
      dataIndex: 'offlineTime',
      key: 'offlineTime',
      width: 180,
      render: (time: Date) => time.toLocaleString('zh-CN'),
    },
    {
      title: '交易Hash链接',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      width: 150,
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
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: () => (
        <Tag color="red">离线中</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Link href={`/machine/detail/${record.machineId}`}>
          <Button type="link" size="small" style={{ padding: 0 }}>
            查看详情
          </Button>
        </Link>
      ),
    },
  ];

  if (error) {
    return (
      <Card title="离线机器列表" style={{ margin: '20px' }}>
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
      title="离线机器列表"
      style={{ margin: '20px' }}
      extra={
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <Form.Item name="machineId" style={{ marginBottom: 0 }}>
            <Input
              placeholder="输入机器ID搜索"
              style={{ width: 200 }}
              disabled={searching}
            />
          </Form.Item>
          <Form.Item name="holder" style={{ marginBottom: 0 }}>
            <Input
              placeholder="输入持有者地址搜索"
              style={{ width: 200 }}
              disabled={searching}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SearchOutlined />} 
              loading={searching}
            >
              搜索
            </Button>
          </Form.Item>
          {(searchFilters.machineId || searchFilters.holder) && (
            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                icon={<ClearOutlined />} 
                onClick={handleClearSearch} 
                disabled={searching}
              >
                清除
              </Button>
            </Form.Item>
          )}
        </Form>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '10px' }}>加载离线机器记录中...</div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            {(searchFilters.machineId || searchFilters.holder) ? (
              <span>
                搜索结果：
                {searchFilters.machineId && (
                  <span> 机器ID包含 &ldquo;{searchFilters.machineId}&rdquo;</span>
                )}
                {searchFilters.machineId && searchFilters.holder && <span>，</span>}
                {searchFilters.holder && (
                  <span> 持有者地址包含 &ldquo;{searchFilters.holder}&rdquo;</span>
                )}
                <span> - 共 {total} 条记录</span>
              </span>
            ) : (
              <span>共 {total} 条离线机器记录</span>
            )}
          </div>
          
          {offlineRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              {(searchFilters.machineId || searchFilters.holder) ? '未找到匹配的离线机器记录' : '暂无离线机器记录'}
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={offlineRecords}
              rowKey={(record) => record.id}
              pagination={{
                current: currentPage,
                pageSize: currentPageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                onChange: async (page, pageSize) => {
                  setCurrentPage(page);
                  if (pageSize !== currentPageSize) {
                    setCurrentPageSize(pageSize);
                    setCurrentPage(1);
                    await fetchData(searchFilters, 1, pageSize);
                  } else {
                    await fetchData(searchFilters, page, pageSize);
                  }
                },
                onShowSizeChange: async (current, size) => {
                  setCurrentPageSize(size);
                  setCurrentPage(1);
                  await fetchData(searchFilters, 1, size);
                },
              }}
              scroll={{ x: 1180 }}
              size="middle"
            />
          )}
        </>
      )}
    </Card>
  );
}