import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Tooltip, Modal, Typography, message } from 'antd';
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
import tokenConfigApi from '../../services/tokenConfigApi';

const { Title, Text } = Typography;

const TokenConfigsTable = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [tokenConfigs, setTokenConfigs] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Load token configurations on component mount
  useEffect(() => {
    loadTokenConfigs();
  }, []);

  const loadTokenConfigs = async () => {
    try {
      setTableLoading(true);
      const response = await tokenConfigApi.getAllTokenConfigs();
      setTokenConfigs(response.data || []);
    } catch (error) {
      console.error('Failed to load token configurations:', error);
      message.error('Failed to load token configurations');
    } finally {
      setTableLoading(false);
    }
  };

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

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await tokenConfigApi.deleteTokenConfig(configToDelete.id);
      message.success('Token configuration deleted successfully');
      setDeleteModalVisible(false);
      setConfigToDelete(null);
      loadTokenConfigs(); // Reload the list
    } catch (error) {
      console.error('Failed to delete token configuration:', error);
      message.error('Failed to delete token configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingConfig) {
        await tokenConfigApi.updateTokenConfig(editingConfig.id, formData);
        message.success('Token configuration updated successfully');
      } else {
        await tokenConfigApi.createTokenConfig(formData);
        message.success('Token configuration created successfully');
      }
      setFormModalVisible(false);
      setEditingConfig(null);
      loadTokenConfigs(); // Reload the list
    } catch (error) {
      console.error('Failed to save token configuration:', error);
      message.error('Failed to save token configuration');
    }
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
      dataIndex: 'token_path',
      key: 'token_path',
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
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date) => date ? new Date(date).toLocaleString() : 'Never',
      sorter: (a, b) => {
        if (!a.lastUsedAt && !b.lastUsedAt) return 0;
        if (!a.lastUsedAt) return 1;
        if (!b.lastUsedAt) return -1;
        return new Date(a.lastUsedAt) - new Date(b.lastUsedAt);
      },
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
        dataSource={tokenConfigs}
        rowKey="id"
        loading={tableLoading}
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
