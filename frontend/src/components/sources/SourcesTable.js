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

const { Title } = Typography;


const SourcesTable = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Fetch API sources on component mount
  useEffect(() => {
    fetchApiSources();
  }, []);

  const fetchApiSources = async () => {
    try {
      setFetching(true);
      const response = await apiSourceApi.getAllApiSources();
      if (response.success) {
        setDataSource(response.data);
      } else {
        message.error('Failed to fetch API sources: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching API sources:', error);
      message.error('Failed to fetch API sources: ' + error.message);
    } finally {
      setFetching(false);
    }
  };

  const handleCreateSource = () => {
    navigate('/sources/new');
  };

  const handleEditSource = (id) => {
    // Navigate to edit wizard for this source
    navigate(`/sources/edit/${id}`);
  };

  const showDeleteConfirm = (source) => {
    setSourceToDelete(source);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sourceToDelete) return;
    
    try {
      setLoading(true);
      const response = await apiSourceApi.deleteApiSource(sourceToDelete.id);
      
      if (response.success) {
        message.success('API source deleted successfully');
        // Refresh the data
        await fetchApiSources();
        // Clear selection
        setSelectedRowKeys([]);
      } else {
        message.error('Failed to delete API source: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting API source:', error);
      message.error('Failed to delete API source: ' + error.message);
    } finally {
      setLoading(false);
      setDeleteModalVisible(false);
      setSourceToDelete(null);
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
      title: 'Base URL',
      dataIndex: 'base_url',
      key: 'base_url',
      ellipsis: true,
    },
    {
      title: 'Auth Type',
      dataIndex: 'authType',
      key: 'authType',
      render: (authType) => {
        let color;
        switch (authType) {
          case 'api_key':
            color = 'blue';
            break;
          case 'oauth2':
            color = 'green';
            break;
          case 'token':
            color = 'purple';
            break;
          case 'basic':
            color = 'orange';
            break;
          case 'none':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{authType ? authType.toUpperCase().replace('_', ' ') : 'NONE'}</Tag>;
      },
      filters: [
        { text: 'API Key', value: 'api_key' },
        { text: 'OAuth 2.0', value: 'oauth2' },
        { text: 'Token', value: 'token' },
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
          {status ? status.toUpperCase() : 'INACTIVE'}
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
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
      sorter: (a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      },
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
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchApiSources}
            loading={fetching}
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
        pagination={{ pageSize: 10 }}
        loading={fetching}
        locale={{
          emptyText: 'No API sources found. Create your first source to get started.'
        }}
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
