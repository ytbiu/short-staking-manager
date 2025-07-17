'use client';

import React, { useEffect } from 'react';
import { Table, Card, Input, Button, Alert, Spin, Tag, Tooltip, Form } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useRentingMachineStore } from '@/app/stores/rentingMachineStore';
import { ProcessedRentingRecord } from '@/app/graphql/rentingMachineQuery';

export default function RentingMachineList() {
  const {
    rentingRecords,
    loading,
    error,
    searching,
    currentPage,
    currentPageSize,
    total,
    fetchData,
    handleSearch,
    handleClearSearch,
    handlePageChange
  } = useRentingMachineStore();
  
  const [form] = Form.useForm();

  // 格式化地址显示
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };



  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 搜索提交处理
  const handleSearchSubmit = (values: { machineId?: string; machineOwner?: string }) => {
    const filters = {
      machineId: values.machineId?.trim() || undefined,
      machineOwner: values.machineOwner?.trim() || undefined,
    };
    handleSearch(filters);
  };

  // 清除搜索处理
  const handleClearSearchClick = () => {
    form.resetFields();
    handleClearSearch();
  };

  // 表格列定义
  const columns: ColumnsType<ProcessedRentingRecord> = [
    {
      title: '机器ID',
      dataIndex: 'machineId',
      key: 'machineId',
      width: 200,
      render: (machineId: string) => {
        const shortMachineId = `${machineId.slice(0, 8)}...${machineId.slice(-6)}`;
        return (
          <Tooltip title={machineId}>
            <Link 
              href={`/machine/detail/${machineId}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {shortMachineId}
            </Link>
          </Tooltip>
        );
      },
    },
    {
      title: '机器所有者',
      dataIndex: 'machineOwner',
      key: 'machineOwner',
      width: 150,
      render: (address: string) => (
        <Tooltip title={address}>
          <span className="font-mono text-sm">
            {formatAddress(address)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '租用ID',
      dataIndex: 'rentId',
      key: 'rentId',
      width: 120,
      render: (rentId: string) => (
        <span className="font-mono text-sm">
          {rentId}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '租用中' : '已结束'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="租用中机器列表" className="shadow-lg">
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearchSubmit}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              label="机器ID"
              name="machineId"
              className="mb-0"
            >
              <Input
                placeholder="请输入机器ID"
                allowClear
              />
            </Form.Item>
            
            <Form.Item
              label="机器所有者"
              name="machineOwner"
              className="mb-0"
            >
              <Input
                placeholder="请输入机器所有者地址"
                allowClear
              />
            </Form.Item>
            
            <Form.Item label=" " className="mb-0">
              <div className="flex gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={searching}
                >
                  搜索
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearSearchClick}
                  disabled={searching}
                >
                  清除
                </Button>
              </div>
            </Form.Item>
          </div>
        </Form>

        {/* 错误提示 */}
        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {/* 数据表格 */}
        <Spin spinning={loading}>
          <Table<ProcessedRentingRecord>
            columns={columns}
            dataSource={rentingRecords}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: currentPageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: handlePageChange,
              onShowSizeChange: handlePageChange,
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        </Spin>
      </Card>
    </div>
  );
}