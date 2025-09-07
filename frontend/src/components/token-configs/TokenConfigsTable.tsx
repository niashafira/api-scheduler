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
import { TokenConfig, TableColumnConfig, FilterOption } from '../../types';

const { Title, Text } = Typography;

const TokenConfigsTable: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [configToDelete, setConfigToDelete] = useState<TokenConfig | null>(null);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<TokenConfig | null>(null);
  const [tokenConfigs, setTokenConfigs] = useState<TokenConfig[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(true);

  // Load token configurations on component mount
  useEffect(() => {
    loadTokenConfigs();
  }, []);

  const loadTokenConfigs = async (): Promise<void> => {
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

  const handleCreateConfig = (): void => {
    setEditingConfig(null);
    setFormModalVisible(true);
  };

  const handleEditConfig = (config: TokenConfig): void => {
    setEditingConfig(config);
    setFormModalVisible(true);
  };

  const handleTestConfig = (config: TokenConfig): void => {
    console.log('Testing token config:', config);
    // Navigate to test page or open test modal
  };

  const showDeleteConfirm = (config: TokenConfig): void => {
    setConfigToDelete(config);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    try {
      setLoading(true);
      await tokenConfigApi.deleteTokenConfig(configToDelete!.id);
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

  const handleFormSubmit = async (formData: any): Promise<void> => {
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

  const columns: TableColumnConfig[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>,
      sorter: (a: TokenConfig, b: TokenConfig) => a.name.localeCompare(b.name),
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
      render: (method: string) => <Tag color="blue">{method}</Tag>,
      filters: [
        { text: 'POST', value: 'POST' },
        { text: 'GET', value: 'GET' },
        { text: 'PUT', value: 'PUT' },
      ] as FilterOption[],
      onFilter: (value: any, record: TokenConfig) => record.method === value,
    },
    {
      title: 'Token Path',
      dataIndex: 'token_path',
      key: 'token_path',
      render: (path: string) => <Text code>{path}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'} icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ] as FilterOption[],
      onFilter: (value: any, record: TokenConfig) => record.status === value,
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date: string | null) => date ? new Date(date).toLocaleString() : 'Never',
      sorter: (a: TokenConfig, b: TokenConfig) => {
        if (!a.lastUsedAt && !b.lastUsedAt) return 0;
        if (!a.lastUsedAt) return 1;
        if (!b.lastUsedAt) return -1;
        return new Date(a.lastUsedAt!).getTime() - new Date(b.lastUsedAt!).getTime();
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: TokenConfig, b: TokenConfig) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TokenConfig) => (
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
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
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
