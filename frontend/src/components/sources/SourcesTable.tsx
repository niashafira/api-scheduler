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
import apiRequestApi from '../../services/apiRequestApi';
import { ApiRequest, TableColumnConfig, FilterOption } from '../../types';

const { Title } = Typography;

const SourcesTable: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [sourceToDelete, setSourceToDelete] = useState<ApiRequest | null>(null);
  const [dataSource, setDataSource] = useState<ApiRequest[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);

  // Fetch API requests on component mount
  useEffect(() => {
    fetchApiRequests();
  }, []);

  const fetchApiRequests = async (): Promise<void> => {
    try {
      setFetching(true);
      const response = await apiRequestApi.getAllApiRequests();
      if (response.success) {
        setDataSource(response.data || []);
      } else {
        message.error('Failed to fetch API requests: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching API requests:', error);
      message.error('Failed to fetch API requests: ' + (error as Error).message);
    } finally {
      setFetching(false);
    }
  };

  const handleCreateSource = (): void => {
    navigate('/sources/new');
  };

  const handleEditSource = (record: ApiRequest): void => {
    // Navigate to edit wizard for the associated source
    navigate(`/sources/edit/${record.apiSourceId}`);
  };

  const handleDeleteClick = (record: ApiRequest): void => {
    setSourceToDelete(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!sourceToDelete) return;

    try {
      setLoading(true);
      const response = await apiRequestApi.deleteApiRequest(sourceToDelete.id);
      if (response.success) {
        message.success('API request deleted successfully');
        setDataSource(dataSource.filter(item => item.id !== sourceToDelete.id));
      } else {
        message.error('Failed to delete API request: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting API request:', error);
      message.error('Failed to delete API request: ' + (error as Error).message);
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

  const handleMarkAsUsed = async (record: ApiRequest): Promise<void> => {
    try {
      const response = await apiRequestApi.markApiRequestAsExecuted(record.id);
      if (response.success) {
        message.success('API request marked as executed');
        fetchApiRequests(); // Refresh the data
      } else {
        message.error('Failed to mark API request as executed: ' + response.message);
      }
    } catch (error) {
      console.error('Error marking API request as executed:', error);
      message.error('Failed to mark API request as executed: ' + (error as Error).message);
    }
  };

  const handleRefresh = (): void => {
    fetchApiRequests();
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

  const getMethodTag = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'blue',
      'POST': 'green',
      'PUT': 'orange',
      'PATCH': 'purple',
      'DELETE': 'red',
      'HEAD': 'default',
      'OPTIONS': 'default'
    };
    return <Tag color={colors[method] || 'default'}>{method}</Tag>;
  };

  const columns: TableColumnConfig[] = [
    {
      title: 'Request',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ApiRequest) => (
        <div style={{ textAlign: 'left' }}>
          <Space align="start">
            <ApiOutlined />
            <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
              <Button type="link" onClick={() => handleEditSource(record)} style={{ padding: 0, height: 'auto', whiteSpace: 'normal' }}>
                {text}
              </Button>
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'apiSource',
      key: 'apiSource',
      render: (_: any, record: ApiRequest) => record.apiSource?.name || record.apiSourceId,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => getMethodTag(method),
      filters: [
        { text: 'GET', value: 'GET' },
        { text: 'POST', value: 'POST' },
        { text: 'PUT', value: 'PUT' },
        { text: 'PATCH', value: 'PATCH' },
        { text: 'DELETE', value: 'DELETE' },
      ] as FilterOption[],
      onFilter: (value: string, record: ApiRequest) => record.method === value,
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
      onFilter: (value: string, record: ApiRequest) => record.status === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a: ApiRequest, b: ApiRequest) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApiRequest) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditSource(record)}
            />
          </Tooltip>
          <Tooltip title="Mark as Executed">
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
            Create Configuration
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
        title="Delete API Request"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmLoading={loading}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete the API request "{sourceToDelete?.name}"?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default SourcesTable;
