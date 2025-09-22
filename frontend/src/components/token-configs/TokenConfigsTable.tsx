import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Tooltip, Modal, Typography, message, Spin } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  KeyOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
import TokenConfigForm from './TokenConfigForm';
import tokenConfigApi from '../../services/tokenConfigApi';
import { TokenConfig, TableColumnConfig, FilterOption } from '../../types';
import { apiService } from '../../utils/apiService';

const { Title, Text } = Typography;

const TokenConfigsTable: React.FC = () => {
  // const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<TokenConfig | null>(null);
  const [tokenConfigs, setTokenConfigs] = useState<TokenConfig[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(true);
  const [testModalVisible, setTestModalVisible] = useState<boolean>(false);
  const [testModalLoading, setTestModalLoading] = useState<boolean>(false);
  const [testModalData, setTestModalData] = useState<any>(null);
  const [testModalMeta, setTestModalMeta] = useState<{ endpoint?: string; method?: string; headers?: any[]; body?: any } | null>(null);

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

  const handleTestConfig = async (config: TokenConfig): Promise<void> => {
    try {
      const endpoint = (config as any).endpoint || config.tokenUrl;
      if (!endpoint) throw new Error('Missing token endpoint URL');
      const method = (config as any).method || 'POST';
      const headers = (config as any).headers || [];
      const body = (config as any).body || '';
      const tokenPath = (config as any).tokenPath || 'access_token';
      const expiresInPath = (config as any).expiresInPath;
      const refreshTokenPath = (config as any).refreshTokenPath;

      setTestModalMeta({ endpoint, method, headers, body });
      setTestModalVisible(true);
      setTestModalLoading(true);

      const result = await apiService.testTokenAcquisition({
        endpoint,
        method,
        headers,
        body,
        tokenPath,
        expiresInPath,
        refreshTokenPath
      });

      setTestModalData({ ok: true, result });
    } catch (e: any) {
      console.error('Token config test failed:', e);
      setTestModalData({ ok: false, error: e });
      if (!testModalVisible) setTestModalVisible(true);
    } finally {
      setTestModalLoading(false);
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
      render: (text: string) => <span>{text}</span>,
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
      dataIndex: 'tokenPath',
      key: 'tokenPath',
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
        title="Test Token Connection"
        open={testModalVisible}
        onCancel={() => { setTestModalVisible(false); setTestModalData(null); }}
        footer={[
          <Button key="close" onClick={() => { setTestModalVisible(false); setTestModalData(null); }}>Close</Button>
        ]}
        width={800}
      >
        {testModalLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            {testModalMeta && (
              <div style={{ marginBottom: 12 }}>
                <Title level={5} style={{ marginBottom: 4 }}>Request</Title>
                <div><Text strong>Endpoint: </Text><Text code>{testModalMeta.endpoint}</Text></div>
                <div style={{ marginTop: 4 }}><Text strong>Method: </Text><Tag color="blue">{testModalMeta.method}</Tag></div>
                {testModalMeta.headers && testModalMeta.headers.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <Text strong>Headers:</Text>
                    <div style={{ marginTop: 4 }}>
                      {testModalMeta.headers.map((h: any, idx: number) => (
                        <div key={idx}><Text code>{h.key}</Text>: <Text code>{h.value}</Text></div>
                      ))}
                    </div>
                  </div>
                )}
                {testModalMeta.body && (
                  <div style={{ marginTop: 6 }}>
                    <Text strong>Body:</Text>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                      {typeof testModalMeta.body === 'string' ? testModalMeta.body : JSON.stringify(testModalMeta.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {testModalData?.ok ? (
              <>
                <Title level={5} style={{ marginBottom: 4 }}>Result</Title>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Token: </Text>
                  <code>{testModalData.result?.token ? String(testModalData.result.token).substring(0, 60) + '...' : 'N/A'}</code>
                </div>
                {testModalData.result?.expiresIn != null && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Expires In: </Text>{testModalData.result.expiresIn} seconds
                  </div>
                )}
                {testModalData.result?.refreshToken && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Refresh Token: </Text><code>{String(testModalData.result.refreshToken).substring(0, 40)}...</code>
                  </div>
                )}
                {testModalData.result?.fullResponse && (
                  <div>
                    <Title level={5} style={{ marginBottom: 4 }}>Full Response</Title>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{JSON.stringify(testModalData.result.fullResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : testModalData ? (
              <>
                <Title level={5} style={{ marginBottom: 4, color: '#cf1322' }}>Error</Title>
                <div style={{ marginBottom: 8 }}><Text>{testModalData.error?.message || 'Unknown error'}</Text></div>
                {testModalData.error?.response && (
                  <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{JSON.stringify(testModalData.error.response, null, 2)}
                  </pre>
                )}
              </>
            ) : null}
          </div>
        )}
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
