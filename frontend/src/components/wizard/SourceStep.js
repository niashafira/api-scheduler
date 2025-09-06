import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Select, 
  Space, 
  Typography, 
  Divider,
  Switch,
  message,
  Tabs,
  Alert,
  Steps
} from 'antd';
import { 
  PlusOutlined, 
  LinkOutlined, 
  LockOutlined, 
  ApiOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
// Only need apiSourceApi for creating the source
// No need for apiService or jsonPath since we removed the test functionality
import tokenConfigApi from '../../services/tokenConfigApi';
import apiSourceApi from '../../services/apiSourceApi';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Step } = Steps;

const SourceStep = ({ onNext, onPrevious }) => {
  const [form] = Form.useForm();
  const [authType, setAuthType] = useState('none');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [activeTab, setActiveTab] = useState('create');
  const [existingTokenConfigs, setExistingTokenConfigs] = useState([]);
  const [loadingTokenConfigs, setLoadingTokenConfigs] = useState(false);
  const [selectedTokenConfigId, setSelectedTokenConfigId] = useState(null);
  const [tokenConfig, setTokenConfig] = useState({
    enabled: false,
    endpoint: '',
    method: 'POST',
    headers: [{ key: '', value: '' }],
    body: '',
    tokenPath: 'access_token',
    expiresInPath: 'expires_in',
    refreshTokenPath: 'refresh_token',
    expiresIn: 3600,
    refreshEnabled: false
  });

  // Fetch existing token configurations when component mounts
  useEffect(() => {
    fetchExistingTokenConfigs();
  }, []);

  const fetchExistingTokenConfigs = async () => {
    try {
      setLoadingTokenConfigs(true);
      const configs = await tokenConfigApi.getActiveTokenConfigs();
      setExistingTokenConfigs(configs.data || configs);
    } catch (error) {
      console.error('Failed to fetch token configurations:', error);
      message.error('Failed to load existing token configurations');
    } finally {
      setLoadingTokenConfigs(false);
    }
  };

  const handleAuthTypeChange = (value) => {
    setAuthType(value);
    if (value === 'token') {
      setTokenConfig({...tokenConfig, enabled: true});
    } else {
      setTokenConfig({...tokenConfig, enabled: false});
      setSelectedTokenConfigId(null);
    }
  };

  const handleTokenConfigSelect = async (configId) => {
    if (!configId) {
      setSelectedTokenConfigId(null);
      setTokenConfig({
        enabled: false,
        endpoint: '',
        method: 'POST',
        headers: [{ key: '', value: '' }],
        body: '',
        tokenPath: 'access_token',
        expiresInPath: 'expires_in',
        refreshTokenPath: 'refresh_token',
        expiresIn: 3600,
        refreshEnabled: false
      });
      return;
    }

    try {
      setLoadingTokenConfigs(true);
      // Ensure configId is treated as an integer
      const numericId = parseInt(configId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid token configuration ID');
      }
      
      const config = await tokenConfigApi.getTokenConfig(numericId);
      const configData = config.data || config;
      
      setSelectedTokenConfigId(numericId);
      setTokenConfig({
        enabled: true,
        endpoint: configData.endpoint,
        method: configData.method,
        headers: configData.headers || [{ key: '', value: '' }],
        body: configData.body || '',
        tokenPath: configData.token_path,
        expiresInPath: configData.expires_in_path,
        refreshTokenPath: configData.refresh_token_path,
        expiresIn: configData.expires_in || 3600,
        refreshEnabled: configData.refresh_enabled || false
      });
    } catch (error) {
      console.error('Failed to load token configuration:', error);
      message.error('Failed to load selected token configuration');
    } finally {
      setLoadingTokenConfigs(false);
    }
  };


  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    const updatedHeaders = [...headers];
    updatedHeaders.splice(index, 1);
    setHeaders(updatedHeaders);
  };

  const updateHeader = (index, field, value) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index][field] = value;
    setHeaders(updatedHeaders);
  };


  const handleSubmit = async (values) => {
    try {
      console.log('Form values:', values);
      
      // Process form values and headers
      const formData = {
        ...values,
        headers: headers.filter(h => h.key && h.value),
        tokenConfig: authType === 'token' ? {
          ...tokenConfig,
          selectedConfigId: selectedTokenConfigId ? parseInt(selectedTokenConfigId, 10) : null
        } : null,
      };
      
      console.log('Processed form data:', formData);
      
      // Create API source in backend
      const response = await apiSourceApi.createApiSource(formData);
      console.log('API source created:', response);
      
      message.success('API source created successfully!');
      
      // Move to next step with the created source data
      if (onNext) onNext({ ...formData, id: response.data.id });
      
    } catch (error) {
      console.error('Failed to create API source:', error);
      message.error('Failed to create API source: ' + error.message);
    }
  };

  return (
    <Card title={<Title level={4}><ApiOutlined /> Step 1: Choose API Source</Title>} bordered={false}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Create New Source" key="create">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              name: '',
              baseUrl: '',
              authType: 'none',
            }}
          >
            <Form.Item
              name="name"
              label="Source Name"
              rules={[{ required: true, message: 'Please enter a name for this API source' }]}
            >
              <Input placeholder="My API Source" prefix={<ApiOutlined />} />
            </Form.Item>

            <Form.Item
              name="baseUrl"
              label="Base URL"
              rules={[
                { required: true, message: 'Please enter the base URL' },
                { type: 'url', message: 'Please enter a valid URL' }
              ]}
            >
              <Input 
                placeholder="https://api.example.com" 
                prefix={<LinkOutlined />} 
              />
            </Form.Item>

            <Form.Item
              name="authType"
              label="Authentication Type"
            >
              <Select onChange={handleAuthTypeChange} defaultValue="none">
                <Option value="none">No Authentication</Option>
                <Option value="basic">Basic Auth</Option>
                <Option value="bearer">Bearer Token</Option>
                <Option value="apiKey">API Key</Option>
                <Option value="token">Token-based (Dynamic)</Option>
                <Option value="oauth2">OAuth 2.0</Option>
              </Select>
            </Form.Item>

            {authType === 'basic' && (
              <>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: 'Please enter username' }]}
                >
                  <Input placeholder="Username" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: 'Please enter password' }]}
                >
                  <Input.Password placeholder="Password" prefix={<LockOutlined />} />
                </Form.Item>
              </>
            )}

            {authType === 'bearer' && (
              <Form.Item
                name="token"
                label="Bearer Token"
                rules={[{ required: true, message: 'Please enter token' }]}
              >
                <Input.Password placeholder="Bearer Token" prefix={<LockOutlined />} />
              </Form.Item>
            )}

            {authType === 'apiKey' && (
              <>
                <Form.Item
                  name="apiKeyName"
                  label="API Key Name"
                  rules={[{ required: true, message: 'Please enter API key name' }]}
                >
                  <Input placeholder="API Key Name" />
                </Form.Item>
                <Form.Item
                  name="apiKeyValue"
                  label="API Key Value"
                  rules={[{ required: true, message: 'Please enter API key value' }]}
                >
                  <Input.Password placeholder="API Key Value" prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="apiKeyLocation"
                  label="API Key Location"
                  rules={[{ required: true, message: 'Please select API key location' }]}
                >
                  <Select>
                    <Option value="header">Header</Option>
                    <Option value="query">Query Parameter</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            {authType === 'token' && (
              <Card style={{ marginTop: 16 }}>
                <Form.Item
                  name="existingTokenConfig"
                  label="Select Token Configuration"
                  rules={[{ required: true, message: 'Please select a token configuration' }]}
                >
                  <Select 
                    placeholder="Select a token configuration"
                    value={selectedTokenConfigId}
                    onChange={handleTokenConfigSelect}
                    loading={loadingTokenConfigs}
                    allowClear
                  >
                    {existingTokenConfigs.map((config) => (
                      <Option key={config.id} value={config.id}>
                        {config.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Alert
                  message="Token Configuration Required"
                  description={
                    <div>
                      Please select an existing token configuration or create a new one.
                      <br />
                      <a href="/token-configs" target="_blank" rel="noopener noreferrer">
                        <Button type="link" size="small" style={{ padding: 0 }}>
                          Manage Token Configurations →
                        </Button>
                      </a>
                    </div>
                  }
                  type="info"
                  style={{ marginTop: 8 }}
                />
              </Card>
            )}

            {authType === 'oauth2' && (
              <Paragraph>
                OAuth 2.0 configuration requires additional setup. Please contact your administrator.
              </Paragraph>
            )}

            <Divider orientation="left">Headers</Divider>
            
            {headers.map((header, index) => (
              <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Input
                  placeholder="Header Key"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  style={{ width: 200 }}
                />
                <Input
                  placeholder="Header Value"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  style={{ width: 200 }}
                />
                {headers.length > 1 && (
                  <Button 
                    type="text" 
                    danger 
                    onClick={() => removeHeader(index)}
                    icon={<CloseCircleOutlined />}
                  />
                )}
              </Space>
            ))}
            
            <Form.Item>
              <Button 
                type="dashed" 
                onClick={addHeader} 
                block 
                icon={<PlusOutlined />}
              >
                Add Header
              </Button>
            </Form.Item>

            <Form.Item
              name="saveCredentials"
              label="Save Sensitive Information"
              valuePropName="checked"
              tooltip="Store authentication credentials securely"
            >
              <Switch />
            </Form.Item>

            <Divider />

            <Form.Item>
              <Space>
                {onPrevious && (
                  <Button onClick={onPrevious}>
                    Previous
                  </Button>
                )}
                <Button type="primary" htmlType="submit">
                  Next Step
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="Use Existing Source" key="existing">
          <Form layout="vertical">
            <Form.Item
              name="existingSource"
              label="Select Existing Source"
              rules={[{ required: true, message: 'Please select an existing source' }]}
            >
              <Select placeholder="Select a source">
                <Option value="source1">Example API</Option>
                <Option value="source2">Weather API</Option>
                <Option value="source3">E-commerce API</Option>
              </Select>
            </Form.Item>
            
            <Divider />
            
            <Form.Item>
              <Space>
                {onPrevious && (
                  <Button onClick={onPrevious}>
                    Previous
                  </Button>
                )}
                <Button type="primary" onClick={() => onNext && onNext({ sourceId: 'source1' })}>
                  Next Step
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default SourceStep;
