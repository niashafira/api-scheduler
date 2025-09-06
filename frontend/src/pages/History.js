import React from 'react';
import { Typography, Table, Tag, Space, Button, Badge } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title } = Typography;

// Mock data for demonstration
const mockData = [
  {
    id: '1',
    jobName: 'Weather Data Sync',
    status: 'success',
    startTime: '2023-08-15T10:30:00',
    endTime: '2023-08-15T10:31:05',
    recordsProcessed: 120,
    errors: 0,
  },
  {
    id: '2',
    jobName: 'GitHub Issues Import',
    status: 'failed',
    startTime: '2023-08-15T08:00:00',
    endTime: '2023-08-15T08:00:45',
    recordsProcessed: 15,
    errors: 3,
  },
  {
    id: '3',
    jobName: 'Product Catalog Update',
    status: 'running',
    startTime: '2023-08-15T12:00:00',
    endTime: null,
    recordsProcessed: 45,
    errors: 0,
  },
  {
    id: '4',
    jobName: 'Analytics Data Import',
    status: 'success',
    startTime: '2023-08-15T06:00:00',
    endTime: '2023-08-15T06:05:30',
    recordsProcessed: 500,
    errors: 0,
  },
  {
    id: '5',
    jobName: 'User Data Sync',
    status: 'pending',
    startTime: null,
    endTime: null,
    recordsProcessed: 0,
    errors: 0,
  },
];

const History = () => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined />;
      case 'failed':
        return <CloseCircleOutlined />;
      case 'running':
        return <SyncOutlined spin />;
      case 'pending':
        return <ClockCircleOutlined />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'processing';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Job Name',
      dataIndex: 'jobName',
      key: 'jobName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Success', value: 'success' },
        { text: 'Failed', value: 'failed' },
        { text: 'Running', value: 'running' },
        { text: 'Pending', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date) => date ? new Date(date).toLocaleString() : 'Not started',
      sorter: (a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime) - new Date(b.startTime);
      },
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (date) => date ? new Date(date).toLocaleString() : 'In progress',
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        if (!record.startTime || !record.endTime) return '-';
        const start = new Date(record.startTime);
        const end = new Date(record.endTime);
        const durationMs = end - start;
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      },
    },
    {
      title: 'Records',
      dataIndex: 'recordsProcessed',
      key: 'recordsProcessed',
      sorter: (a, b) => a.recordsProcessed - b.recordsProcessed,
    },
    {
      title: 'Errors',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors) => (
        errors > 0 ? <Badge count={errors} style={{ backgroundColor: '#ff4d4f' }} /> : '0'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            title="View Details"
          />
          {record.status === 'failed' && (
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              title="Retry"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Run History</Title>
      <Table 
        columns={columns} 
        dataSource={mockData}
        rowKey="id"
      />
    </div>
  );
};

export default History;
