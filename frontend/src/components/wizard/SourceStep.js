import React, { useState } from 'react';
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
  Collapse,
  InputNumber,
  Radio
} from 'antd';
import { 
  PlusOutlined, 
  LinkOutlined, 
  LockOutlined, 
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  KeyOutlined,
  ClockCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const SourceStep = ({ onNext, onPrevious }) => {
  const [form] = Form.useForm();
  const [authType, setAuthType] = useState('none');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
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

  const handleAuthTypeChange = (value) => {
    setAuthType(value);
    if (value === 'token') {
      setTokenConfig({...tokenConfig, enabled: true});
    } else {
      setTokenConfig({...tokenConfig, enabled: false});
    }
  };

  const addTokenHeader = () => {
    setTokenConfig({
      ...tokenConfig,
      headers: [...tokenConfig.headers, { key: '', value: '' }]
    });
  };

  const removeTokenHeader = (index) => {
    const updatedHeaders = [...tokenConfig.headers];
    updatedHeaders.splice(index, 1);
    setTokenConfig({...tokenConfig, headers: updatedHeaders});
  };

  const updateTokenHeader = (index, field, value) => {
    const updatedHeaders = [...tokenConfig.headers];
    updatedHeaders[index][field] = value;
    setTokenConfig({...tokenConfig, headers: updatedHeaders});
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

  const testConnection = async () => {
    try {
      setTestingConnection(true);
      
      if (authType === 'token' && tokenConfig.enabled) {
        // Test token acquisition
        await testTokenAcquisition();
      } else {
        // Test regular connection
        await testRegularConnection();
      }
      
      setTestResult({ success: true, message: 'Connection test successful!' });
      message.success('Connection test successful!');
    } catch (error) {
      setTestResult({ success: false, message: 'Connection failed: ' + error.message });
      message.error('Connection test failed!');
    } finally {
      setTestingConnection(false);
    }
  };

  const testTokenAcquisition = async () => {
    // Simulate token acquisition test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would make an actual API call
    console.log('Testing token acquisition with config:', tokenConfig);
    
    // Simulate success/failure based on configuration
    if (!tokenConfig.endpoint) {
      throw new Error('Token endpoint is required');
    }
  };

  const testRegularConnection = async () => {
    // Simulate regular connection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real implementation, this would make an actual API call
    console.log('Testing regular connection');
  };

  const handleSubmit = (values) => {
    console.log('Form values:', values);
    // Process form values and headers
    const formData = {
      ...values,
      headers: headers.filter(h => h.key && h.value),
      tokenConfig: authType === 'token' ? tokenConfig : null,
    };
    console.log('Processed form data:', formData);
    
    // Move to next step
    if (onNext) onNext(formData);
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
              <Collapse defaultActiveKey={['1']} ghost>
                <Panel 
                  header={
                    <Space>
                      <KeyOutlined />
                      <Text strong>Token Configuration</Text>
                    </Space>
                  } 
                  key="1"
                >
                  <Form.Item
                    name="tokenEndpoint"
                    label="Token Endpoint URL"
                    rules={[{ required: true, message: 'Please enter the token endpoint URL' }]}
                  >
                    <Input 
                      placeholder="https://api.example.com/oauth/token" 
                      prefix={<LinkOutlined />}
                      value={tokenConfig.endpoint}
                      onChange={(e) => setTokenConfig({...tokenConfig, endpoint: e.target.value})}
                    />
                  </Form.Item>

                  <Form.Item
                    name="tokenMethod"
                    label="Request Method"
                  >
                    <Radio.Group 
                      value={tokenConfig.method}
                      onChange={(e) => setTokenConfig({...tokenConfig, method: e.target.value})}
                    >
                      <Radio value="POST">POST</Radio>
                      <Radio value="GET">GET</Radio>
                      <Radio value="PUT">PUT</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Divider orientation="left">Token Request Headers</Divider>
                  
                  {tokenConfig.headers.map((header, index) => (
                    <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Input
                        placeholder="Header Key"
                        value={header.key}
                        onChange={(e) => updateTokenHeader(index, 'key', e.target.value)}
                        style={{ width: 200 }}
                      />
                      <Input
                        placeholder="Header Value"
                        value={header.value}
                        onChange={(e) => updateTokenHeader(index, 'value', e.target.value)}
                        style={{ width: 200 }}
                      />
                      {tokenConfig.headers.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          onClick={() => removeTokenHeader(index)}
                          icon={<CloseCircleOutlined />}
                        />
                      )}
                    </Space>
                  ))}
                  
                  <Form.Item>
                    <Button 
                      type="dashed" 
                      onClick={addTokenHeader} 
                      block 
                      icon={<PlusOutlined />}
                    >
                      Add Header
                    </Button>
                  </Form.Item>

                  <Form.Item
                    name="tokenBody"
                    label="Request Body (JSON)"
                    tooltip="JSON body for token request. Use {{variable}} for dynamic values."
                  >
                    <Input.TextArea 
                      rows={4}
                      placeholder='{"grant_type": "client_credentials", "client_id": "{{client_id}}", "client_secret": "{{client_secret}}"}'
                      value={tokenConfig.body}
                      onChange={(e) => setTokenConfig({...tokenConfig, body: e.target.value})}
                    />
                  </Form.Item>

                  <Divider orientation="left">Token Response Configuration</Divider>

                  <Form.Item
                    name="tokenPath"
                    label="Token Field Path"
                    tooltip="JSON path to access token in response (e.g., access_token, data.token)"
                  >
                    <Input 
                      placeholder="access_token"
                      value={tokenConfig.tokenPath}
                      onChange={(e) => setTokenConfig({...tokenConfig, tokenPath: e.target.value})}
                    />
                  </Form.Item>

                  <Form.Item
                    name="expiresInPath"
                    label="Expires In Field Path"
                    tooltip="JSON path to token expiration time in response (e.g., expires_in, data.expires_in)"
                  >
                    <Input 
                      placeholder="expires_in"
                      value={tokenConfig.expiresInPath}
                      onChange={(e) => setTokenConfig({...tokenConfig, expiresInPath: e.target.value})}
                    />
                  </Form.Item>

                  <Form.Item
                    name="expiresIn"
                    label="Default Expires In (seconds)"
                    tooltip="Default token expiration time if not provided in response"
                  >
                    <InputNumber 
                      min={60}
                      max={86400}
                      value={tokenConfig.expiresIn}
                      onChange={(value) => setTokenConfig({...tokenConfig, expiresIn: value})}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="refreshTokenPath"
                    label="Refresh Token Field Path (Optional)"
                    tooltip="JSON path to refresh token in response"
                  >
                    <Input 
                      placeholder="refresh_token"
                      value={tokenConfig.refreshTokenPath}
                      onChange={(e) => setTokenConfig({...tokenConfig, refreshTokenPath: e.target.value})}
                    />
                  </Form.Item>

                  <Form.Item
                    name="refreshEnabled"
                    label="Enable Token Refresh"
                    valuePropName="checked"
                    tooltip="Automatically refresh token when it expires"
                  >
                    <Switch 
                      checked={tokenConfig.refreshEnabled}
                      onChange={(checked) => setTokenConfig({...tokenConfig, refreshEnabled: checked})}
                    />
                  </Form.Item>
                </Panel>
              </Collapse>
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

            <Space>
              <Button 
                type="primary" 
                onClick={testConnection} 
                loading={testingConnection}
                icon={<CheckCircleOutlined />}
              >
                Test Connection
              </Button>
              
              {testResult && (
                <Text
                  type={testResult.success ? 'success' : 'danger'}
                  style={{ marginLeft: 8 }}
                >
                  {testResult.message}
                </Text>
              )}
            </Space>

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
