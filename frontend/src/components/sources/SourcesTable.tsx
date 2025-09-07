import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Tooltip, Modal, Typography, message, Spin } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ApiOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiSourceApi from '../../services/apiSourceApi';
import { ApiSource, TableColumnConfig, FilterOption } from '../../types';

const { Title } = Typography;

const SourcesTable: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [sourceToDelete, setSourceToDelete] = useState<ApiSource | null>(null);
  const [dataSource, setDataSource] = useState<ApiSource[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);

  // Fetch API sources on component mount
  useEffect(() => {
    fetchApiSources();
  }, []);

  const fetchApiSources = async (): Promise<void> => {
    try {
      setFetching(true);
      const response = await apiSourceApi.getAllApiSources();
      if (response.success) {
        setDataSource(response.data || []);
      } else {
        message.error('Failed to fetch API sources: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching API sources:', error);
      message.error('Failed to fetch API sources: ' + (error as Error).message);
    } finally {
      setFetching(false);
    }
  };

  const handleCreateSource = (): void => {
    navigate('/sources/new');
  };

  const handleEditSource = (record: ApiSource): void => {
    navigate(`/sources/edit/${record.id}`);
  };

  const handleDeleteClick = (record: ApiSource): void => {
    setSourceToDelete(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!sourceToDelete) return;

    try {
      setLoading(true);
      const response = await apiSourceApi.deleteApiSource(sourceToDelete.id);
      if (response.success) {
        message.success('API source deleted successfully');
        setDataSource(dataSource.filter(item => item.id !== sourceToDelete.id));
      } else {
        message.error('Failed to delete API source: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting API source:', error);
      message.error('Failed to delete API source: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setDeleteModalVisible(false);
      setSourceToDelete(null);
    }
  };

  const handleDeleteCancel = (): void => {
    setDeleteModalVisible(false);
    setSourceToDelete(null);
  };

  const handleMarkAsUsed = async (record: ApiSource): Promise<void> => {
    try {
      const response = await apiSourceApi.markApiSourceAsUsed(record.id);
      if (response.success) {
        message.success('API source marked as used');
        fetchApiSources(); // Refresh the data
      } else {
        message.error('Failed to mark API source as used: ' + response.message);
      }
    } catch (error) {
      console.error('Error marking API source as used:', error);
      message.error('Failed to mark API source as used: ' + (error as Error).message);
    }
  };

  const handleRefresh = (): void => {
    fetchApiSources();
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>;
      case 'inactive':
        return <Tag color="error" icon={<CloseCircleOutlined />}>Inactive</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getAuthTypeTag = (authType: string) => {
    const colors: Record<string, string> = {
      'none': 'default',
      'basic': 'blue',
      'bearer': 'green',
      'apiKey': 'orange',
      'token': 'purple',
      'oauth2': 'cyan'
    };
    return <Tag color={colors[authType] || 'default'}>{authType.toUpperCase()}</Tag>;
  };

  const columns: TableColumnConfig[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ApiSource) => (
        <Space>
          <ApiOutlined />
          <a onClick={() => handleEditSource(record)}>{text}</a>
        </Space>
      ),
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
      render: (authType: string) => getAuthTypeTag(authType),
      filters: [
        { text: 'None', value: 'none' },
        { text: 'Basic', value: 'basic' },
        { text: 'Bearer', value: 'bearer' },
        { text: 'API Key', value: 'apiKey' },
        { text: 'Token', value: 'token' },
        { text: 'OAuth2', value: 'oauth2' },
      ] as FilterOption[],
      onFilter: (value: string, record: ApiSource) => record.authType === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ] as FilterOption[],
      onFilter: (value: string, record: ApiSource) => record.status === value,
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date: string | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
      },
      sorter: (a: ApiSource, b: ApiSource) => {
        if (!a.lastUsedAt && !b.lastUsedAt) return 0;
        if (!a.lastUsedAt) return 1;
        if (!b.lastUsedAt) return -1;
        return new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime();
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a: ApiSource, b: ApiSource) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApiSource) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditSource(record)}
            />
          </Tooltip>
          <Tooltip title="Mark as Used">
            <Button 
              type="text" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleMarkAsUsed(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteClick(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>API Sources</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateSource}
          >
            Create Source
          </Button>
        </Space>
      </div>
      
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number, range: [number, number]) => 
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Modal
        title="Delete API Source"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmLoading={loading}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete the API source "{sourceToDelete?.name}"?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default SourcesTable;
