import React, { useState } from 'react';
import { Table, Button, Space, Tag, Tooltip, Modal, Typography } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

// Mock data for demonstration
const mockData = [
  {
    id: '1',
    name: 'Weather API',
    baseUrl: 'https://api.weatherapi.com/v1',
    authType: 'apiKey',
    status: 'active',
    lastUsed: '2023-08-15T10:30:00',
    createdAt: '2023-07-01T14:22:00',
  },
  {
    id: '2',
    name: 'GitHub API',
    baseUrl: 'https://api.github.com',
    authType: 'oauth2',
    status: 'active',
    lastUsed: '2023-08-14T16:45:00',
    createdAt: '2023-06-15T09:10:00',
  },
  {
    id: '3',
    name: 'E-commerce Product API',
    baseUrl: 'https://api.myshop.com/products',
    authType: 'bearer',
    status: 'inactive',
    lastUsed: '2023-07-20T11:15:00',
    createdAt: '2023-05-10T13:40:00',
  },
  {
    id: '4',
    name: 'Analytics API',
    baseUrl: 'https://analytics.example.org/api',
    authType: 'basic',
    status: 'active',
    lastUsed: '2023-08-10T09:20:00',
    createdAt: '2023-04-22T10:30:00',
  },
  {
    id: '5',
    name: 'Payment Gateway API',
    baseUrl: 'https://payments.example.com/v2',
    authType: 'apiKey',
    status: 'inactive',
    lastUsed: '2023-06-05T14:50:00',
    createdAt: '2023-03-15T16:20:00',
  },
];

const SourcesTable = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState(null);

  const handleCreateSource = () => {
    navigate('/wizard');
  };

  const handleEditSource = (id) => {
    console.log('Edit source with id:', id);
    // Navigate to edit page or open edit modal
  };

  const showDeleteConfirm = (source) => {
    setSourceToDelete(source);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Deleted source:', sourceToDelete);
      setLoading(false);
      setDeleteModalVisible(false);
      setSourceToDelete(null);
    }, 1000);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Base URL',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      ellipsis: true,
    },
    {
      title: 'Auth Type',
      dataIndex: 'authType',
      key: 'authType',
      render: (authType) => {
        let color;
        switch (authType) {
          case 'apiKey':
            color = 'blue';
            break;
          case 'oauth2':
            color = 'green';
            break;
          case 'bearer':
            color = 'purple';
            break;
          case 'basic':
            color = 'orange';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{authType.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'API Key', value: 'apiKey' },
        { text: 'OAuth 2.0', value: 'oauth2' },
        { text: 'Bearer Token', value: 'bearer' },
        { text: 'Basic Auth', value: 'basic' },
        { text: 'None', value: 'none' },
      ],
      onFilter: (value, record) => record.authType === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'} icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.lastUsed) - new Date(b.lastUsed),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditSource(record.id)} 
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => showDeleteConfirm(record)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}><ApiOutlined /> API Sources</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateSource}
        >
          Create Source
        </Button>
      </div>
      
      <Table 
        rowSelection={rowSelection}
        columns={columns} 
        dataSource={mockData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Delete API Source"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        confirmLoading={loading}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <p>Are you sure you want to delete the API source "{sourceToDelete?.name}"?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default SourcesTable;
