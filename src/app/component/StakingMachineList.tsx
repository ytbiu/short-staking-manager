"use client";
import { useEffect } from "react";
import { Pagination, Table, Card, Typography, Tooltip, Form, Input, Button, Space, Row, Col, Select } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { Loading } from "./Loading";
import { useStakingMachineStore } from "@/app/stores/stakingMachineStore";
import { StakingMachine, SearchFilters } from "@/app/graphql/stakingMachinesQuery";

const { Text } = Typography;

interface StakingMachineListProps {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export function StakingMachineList({
  pageNo = 1,
  pageSize = 10,
  sortBy = "totalClaimedRewardAmount",
  sortOrder = "desc",
}: StakingMachineListProps) {
  const {
    machines: machinesInStaking,
    currentPage,
    currentPageSize,
    total,
    loading,
    currentSortBy,
    currentSortOrder,
    fetchData,
    handlePageChange,
    handleSearch,
    setCurrentPage,
    setCurrentPageSize,
    setSortBy,
    setSortOrder
  } = useStakingMachineStore();
  
  const [form] = Form.useForm();

  // 初始化store状态
  useEffect(() => {
    setCurrentPage(pageNo);
    setCurrentPageSize(pageSize);
    setSortBy(sortBy);
    setSortOrder(sortOrder);
  }, [pageNo, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<StakingMachine> = [
    {
      title: '机器id',
      dataIndex: 'machineId',
      key: 'machineId',
      width: 150,
      render: (text: string) => {
        const displayText = text.length > 20 
          ? `${text.slice(0, 8)}...${text.slice(-8)}`
          : text;
        return (
          <Tooltip title="click to copy full content">
            <Text
              copyable={{ text }}
              style={{ cursor: 'pointer' }}
            >
              {displayText}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: "钱包地址",
      dataIndex: "holder",
      key: "holder",
      render: (text: string) => {
        const displayText = text.length > 20 
          ? `${text.slice(0, 8)}...${text.slice(-8)}`
          : text;
        return (
          <Tooltip title="click to copy full content">
            <Text
              copyable={{ text }}
              style={{ cursor: 'pointer' }}
            >
              {displayText}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: "额外租金收益",
      dataIndex: "extraRentFee",
      key: "extraRentFee",
      sorter: true,
      sortOrder: currentSortBy === 'extraRentFee' ? (currentSortOrder === 'asc' ? 'ascend' : 'descend') : null,
      sortDirections: ['descend', 'ascend'],
      showSorterTooltip: false,
    },
    {
      title: "已领取金额",
      dataIndex: "totalClaimedRewardAmount",
      key: "totalClaimedRewardAmount",
      sorter: true,
      sortOrder: currentSortBy === 'totalClaimedRewardAmount' ? (currentSortOrder === 'asc' ? 'ascend' : 'descend') : null,
      sortDirections: ['descend', 'ascend'],
      showSorterTooltip: false,
    },
    {
      title: "销毁租金金额",
      dataIndex: "burnedRentFee",
      key: "burnedRentFee",
      sorter: true,
      sortOrder: currentSortBy === 'burnedRentFee' ? (currentSortOrder === 'asc' ? 'ascend' : 'descend') : null,
      sortDirections: ['descend', 'ascend'],
      showSorterTooltip: false,
    },
    {
      title: "质押金额",
      dataIndex: "totalReservedAmount",
      key: "totalReservedAmount",
      sorter: true,
      sortOrder: currentSortBy === 'totalReservedAmount' ? (currentSortOrder === 'asc' ? 'ascend' : 'descend') : null,
      sortDirections: ['descend', 'ascend'],
      showSorterTooltip: false,
    },
    {
      title: "租赁状态",
      dataIndex: "isRented",
      key: "isRented",
      sorter: true,
      sortOrder: currentSortBy === 'isRented' ? (currentSortOrder === 'asc' ? 'ascend' : 'descend') : null,
      sortDirections: ['descend', 'ascend'],
      showSorterTooltip: false,
      render: (isRented: boolean) => (
        <span style={{ color: isRented ? '#52c41a' : '#ff4d4f' }}>
          {isRented ? '已租赁' : '未租赁'}
        </span>
      ),
    },
    {
      title: "注册状态",
      dataIndex: "registered",
      key: "registered",
      sorter: true,
      sortOrder: currentSortBy === 'registered' ? (currentSortOrder === 'asc' ? 'ascend' : 'descend') : null,
      sortDirections: ['descend', 'ascend'],
      showSorterTooltip: false,
      render: (registered: boolean) => (
        <span style={{ color: registered ? '#52c41a' : '#ff4d4f' }}>
          {registered ? '已注册' : '未注册'}
        </span>
      ),
    },

    {
      title: "详情",
      key: "detail",
      width: 80,
      render: (_, record: StakingMachine) => (
        <a
          href={`/machine/detail/${record.machineId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1890ff' }}
        >
          查看详情
        </a>
      ),
    },
  ];

  const handleTableChange: TableProps<StakingMachine>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    // 处理单个排序器
    if (sorter && !Array.isArray(sorter) && sorter.field) {
      const newSortBy = String(sorter.field);
      let newSortOrder: string;
      
      if (sorter.order) {
        // 有明确的排序方向
        newSortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
      } else {
        // 如果没有排序方向，说明是取消排序，切换到相反方向
        if (currentSortBy === newSortBy) {
          newSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          newSortOrder = 'desc'; // 默认降序
        }
      }
      
      // 使用store的handleSort方法
      const { handleSort } = useStakingMachineStore.getState();
      handleSort(newSortBy, newSortOrder);
    }
  };

  const handleSearchSubmit = (values: SearchFilters) => {
    handleSearch(values);
  };

  const handleReset = () => {
    form.resetFields();
    handleSearch({});
  };

  if (loading && machinesInStaking.length === 0) {
    return (
      <Card title="质押中的机器列表" style={{ margin: '20px' }}>
        <Loading tip="Loading..." style={{ minHeight: '300px' }} />
      </Card>
    );
  }

  return (
    <Card title="质押中的机器列表" style={{ margin: '20px' }}>
      {/* 搜索表单 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearchSubmit}
          style={{ marginBottom: 0 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="机器id"
                name="machineId"
              >
                <Input
                  placeholder="输入 Machine ID 进行搜索"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="钱包地址"
                name="holder"
              >
                <Input
                  placeholder="输入 Holder 地址进行搜索"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                label="租赁状态"
                name="isRented"
              >
                <Select
                  placeholder="选择租赁状态"
                  allowClear
                  options={[
                    { value: true, label: "已租赁" },
                    { value: false, label: "未租赁" }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                label="注册状态"
                name="registered"
              >
                <Select
                  placeholder="选择注册状态"
                  allowClear
                  options={[
                    { value: true, label: "已注册" },
                    { value: false, label: "未注册" }
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={8}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={loading}
                  >
                    搜索
                  </Button>
                  <Button
                    onClick={handleReset}
                    icon={<ReloadOutlined />}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Loading spinning={loading}>
        <Table
          columns={columns}
          dataSource={machinesInStaking}
          pagination={false}
          rowKey="machineId"
          onChange={handleTableChange}
        />
      </Loading>
      <div
        style={{ marginTop: '16px', textAlign: 'center' }}>
        <Pagination
          current={currentPage}
          pageSize={currentPageSize}
          total={total}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          onChange={handlePageChange}
          onShowSizeChange={handlePageChange}
        />
      </div>
    </Card>
  );
}