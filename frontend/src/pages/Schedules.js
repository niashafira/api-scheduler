import React from 'react';
import { Typography, Table, Tag, Space, Button, Tooltip } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  HistoryOutlined
} from '@ant-design/icons';

const { Title } = Typography;

// Mock data for demonstration
const mockData = [
  {
    id: '1',
    name: 'Weather Data Sync',
    source: 'Weather API',
    destination: 'weather_data',
    schedule: '*/30 * * * *',
    status: 'active',
    lastRun: '2023-08-15T10:30:00',
    nextRun: '2023-08-15T11:00:00',
  },
  {
    id: '2',
    name: 'GitHub Issues Import',
    source: 'GitHub API',
    destination: 'github_issues',
    schedule: '0 */2 * * *',
    status: 'active',
    lastRun: '2023-08-15T08:00:00',
    nextRun: '2023-08-15T10:00:00',
  },
  {
    id: '3',
    name: 'Product Catalog Update',
    source: 'E-commerce Product API',
    destination: 'products',
    schedule: '0 0 * * *',
    status: 'paused',
    lastRun: '2023-08-14T00:00:00',
    nextRun: null,
  },
  {
    id: '4',
    name: 'Analytics Data Import',
    source: 'Analytics API',
    destination: 'analytics_data',
    schedule: '0 */6 * * *',
    status: 'active',
    lastRun: '2023-08-15T06:00:00',
    nextRun: '2023-08-15T12:00:00',
  },
];

const Schedules = () => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Schedule',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (schedule) => <code>{schedule}</code>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'warning'}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Paused', value: 'paused' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Last Run',
      dataIndex: 'lastRun',
      key: 'lastRun',
      render: (date) => date ? new Date(date).toLocaleString() : 'Never',
    },
    {
      title: 'Next Run',
      dataIndex: 'nextRun',
      key: 'nextRun',
      render: (date) => date ? new Date(date).toLocaleString() : 'Not scheduled',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={record.status === 'active' ? 'Pause' : 'Activate'}>
            <Button 
              type="text" 
              icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
            />
          </Tooltip>
          <Tooltip title="View History">
            <Button 
              type="text" 
              icon={<HistoryOutlined />} 
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>Scheduled Jobs</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
        >
          Create Schedule
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={mockData}
        rowKey="id"
      />
    </div>
  );
};

export default Schedules;
