import React, { useState } from 'react';
import { Table, Button, Space, Tag, Tooltip, Modal, Typography } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  KeyOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TokenConfigForm from './TokenConfigForm';

const { Title, Text } = Typography;

// Mock data for demonstration
const mockData = [
  {
    id: '1',
    name: 'OAuth 2.0 Client Credentials',
    endpoint: 'https://api.example.com/oauth/token',
    method: 'POST',
    status: 'active',
    lastUsed: '2023-08-15T10:30:00',
    createdAt: '2023-07-01T14:22:00',
    tokenPath: 'access_token',
    expiresInPath: 'expires_in',
  },
  {
    id: '2',
    name: 'Custom API Authentication',
    endpoint: 'https://api.myservice.com/auth/login',
    method: 'POST',
    status: 'active',
    lastUsed: '2023-08-14T16:45:00',
    createdAt: '2023-06-15T09:10:00',
    tokenPath: 'data.token',
    expiresInPath: 'data.expires_in',
  },
  {
    id: '3',
    name: 'JWT Token Service',
    endpoint: 'https://jwt.example.com/token',
    method: 'POST',
    status: 'inactive',
    lastUsed: '2023-07-20T11:15:00',
    createdAt: '2023-05-10T13:40:00',
    tokenPath: 'jwt',
    expiresInPath: 'expires_in',
  },
  {
    id: '4',
    name: 'API Gateway Auth',
    endpoint: 'https://gateway.example.com/auth',
    method: 'POST',
    status: 'active',
    lastUsed: '2023-08-10T09:20:00',
    createdAt: '2023-04-22T10:30:00',
    tokenPath: 'access_token',
    expiresInPath: 'expires_in',
  },
];

const TokenConfigsTable = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  const handleCreateConfig = () => {
    setEditingConfig(null);
    setFormModalVisible(true);
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    setFormModalVisible(true);
  };

  const handleTestConfig = (config) => {
    console.log('Testing token config:', config);
    // Navigate to test page or open test modal
  };

  const showDeleteConfirm = (config) => {
    setConfigToDelete(config);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Deleted token config:', configToDelete);
      setLoading(false);
      setDeleteModalVisible(false);
      setConfigToDelete(null);
    }, 1000);
  };

  const handleFormSubmit = (formData) => {
    console.log('Token config submitted:', formData);
    setFormModalVisible(false);
    setEditingConfig(null);
    // Here you would typically save to backend
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
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      ellipsis: true,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method) => <Tag color="blue">{method}</Tag>,
      filters: [
        { text: 'POST', value: 'POST' },
        { text: 'GET', value: 'GET' },
        { text: 'PUT', value: 'PUT' },
      ],
      onFilter: (value, record) => record.method === value,
    },
    {
      title: 'Token Path',
      dataIndex: 'tokenPath',
      key: 'tokenPath',
      render: (path) => <Text code>{path}</Text>,
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
          <Tooltip title="Test Connection">
            <Button 
              type="text" 
              icon={<PlayCircleOutlined />} 
              onClick={() => handleTestConfig(record)} 
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditConfig(record)} 
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
        <Title level={4}><KeyOutlined /> Token Configurations</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateConfig}
        >
          Create Token Config
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
        title="Delete Token Configuration"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        confirmLoading={loading}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <p>Are you sure you want to delete the token configuration "{configToDelete?.name}"?</p>
        <p>This action cannot be undone.</p>
      </Modal>

      <Modal
        title={editingConfig ? 'Edit Token Configuration' : 'Create Token Configuration'}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        footer={null}
        width={800}
      >
        <TokenConfigForm 
          initialData={editingConfig}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default TokenConfigsTable;
