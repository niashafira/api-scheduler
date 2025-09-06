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
  Radio,
  Alert,
  Steps
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
import { apiService, jsonPath } from '../../utils/apiService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;

const SourceStep = ({ onNext, onPrevious }) => {
  const [form] = Form.useForm();
  const [authType, setAuthType] = useState('none');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [testStep, setTestStep] = useState('');
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
      setTestResult(null);
      
      // Validate form first
      const formValues = form.getFieldsValue();
      if (!formValues.baseUrl) {
        throw new Error('Base URL is required');
      }
      
      let result;
      if (authType === 'token' && tokenConfig.enabled) {
        // Validate token configuration
        if (!tokenConfig.endpoint) {
          throw new Error('Token endpoint is required for token-based authentication');
        }
        if (!tokenConfig.tokenPath) {
          throw new Error('Token field path is required');
        }
        
        // Step 1: Test token acquisition
        setTestStep('Acquiring token...');
        const tokenResult = await testTokenAcquisition();
        console.log('Token acquisition successful:', tokenResult);
        
        // Step 2: Test API with acquired token
        setTestStep('Testing API with token...');
        const apiResult = await testApiWithToken(formValues.baseUrl, tokenResult.tokenData.token);
        console.log('API test with token successful:', apiResult);
        
        setTestResult({ 
          success: true, 
          message: 'Token acquisition and API test successful!',
          details: `Token acquired and API endpoint tested successfully`,
          tokenData: tokenResult.tokenData,
          apiTested: true,
          apiResponse: apiResult.response
        });
        message.success('Token acquisition and API test successful!');
      } else {
        // Test regular connection
        result = await testRegularConnection();
        setTestResult({ 
          success: true, 
          message: 'Connection test successful!',
          details: 'API endpoint is reachable'
        });
        message.success('Connection test successful!');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({ 
        success: false, 
        message: 'Connection failed: ' + error.message,
        details: error.message
      });
      message.error('Connection test failed!');
    } finally {
      setTestingConnection(false);
      setTestStep('');
    }
  };

  const testTokenAcquisition = async () => {
    console.log('Testing token acquisition with config:', tokenConfig);
    
    // Validate required fields
    if (!tokenConfig.endpoint) {
      throw new Error('Token endpoint is required');
    }
    
    if (!tokenConfig.tokenPath) {
      throw new Error('Token field path is required');
    }

    // Make the actual API call
    const response = await apiService.testTokenAcquisition(tokenConfig);
    console.log('Token response:', response);
    
    // Extract token data using JSON path
    const tokenData = jsonPath.extractTokenData(response, tokenConfig);
    
    if (!tokenData.isValid) {
      throw new Error(`No valid token found at path: ${tokenConfig.tokenPath}`);
    }
    
    console.log('Extracted token data:', tokenData);
    
    return {
      success: true,
      tokenData,
      response
    };
  };

  const testApiWithToken = async (baseUrl, token) => {
    console.log('Testing API with acquired token:', baseUrl);
    
    if (!baseUrl) {
      throw new Error('Base URL is required');
    }
    
    if (!token) {
      throw new Error('Token is required');
    }

    // Make the actual API call with token
    const response = await apiService.testApiWithToken(baseUrl, token, headers);
    console.log('API response with token:', response);
    
    return {
      success: true,
      response
    };
  };

  const testRegularConnection = async () => {
    const formValues = form.getFieldsValue();
    console.log('Testing regular connection to:', formValues.baseUrl);
    
    if (!formValues.baseUrl) {
      throw new Error('Base URL is required');
    }

    // Make the actual API call
    const response = await apiService.testRegularConnection(formValues.baseUrl, headers);
    console.log('Connection response:', response);
    
    return {
      success: true,
      response
    };
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
              <Collapse defaultActiveKey={['1', '2']} ghost>
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
                
                <Panel 
                  header={
                    <Space>
                      <SettingOutlined />
                      <Text strong>Configuration Examples</Text>
                    </Space>
                  } 
                  key="2"
                >
                  <Alert
                    message="Common Token Configuration Examples"
                    description="Here are some common patterns for token-based authentication:"
                    type="info"
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Card size="small" title="OAuth 2.0 Client Credentials" style={{ marginBottom: 8 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div><Text strong>Endpoint:</Text> <Text code>https://api.example.com/oauth/token</Text></div>
                        <div><Text strong>Method:</Text> <Text code>POST</Text></div>
                        <div><Text strong>Headers:</Text> <Text code>Content-Type: application/json</Text></div>
                        <div><Text strong>Body:</Text></div>
                        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
{`{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}`}
                        </pre>
                        <div><Text strong>Token Path:</Text> <Text code>access_token</Text></div>
                        <div><Text strong>Expires Path:</Text> <Text code>expires_in</Text></div>
                      </Space>
                    </Card>
                    
                    <Card size="small" title="Custom API Token" style={{ marginBottom: 8 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div><Text strong>Endpoint:</Text> <Text code>https://api.example.com/auth/login</Text></div>
                        <div><Text strong>Method:</Text> <Text code>POST</Text></div>
                        <div><Text strong>Headers:</Text> <Text code>Content-Type: application/json</Text></div>
                        <div><Text strong>Body:</Text></div>
                        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
{`{
  "username": "your_username",
  "password": "your_password"
}`}
                        </pre>
                        <div><Text strong>Token Path:</Text> <Text code>data.token</Text></div>
                        <div><Text strong>Expires Path:</Text> <Text code>data.expires_in</Text></div>
                      </Space>
                    </Card>
                  </Space>
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

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                onClick={testConnection} 
                loading={testingConnection}
                icon={<CheckCircleOutlined />}
                block
              >
                {testingConnection ? (testStep || 'Testing...') : 'Test Connection'}
              </Button>
              
              {testingConnection && authType === 'token' && (
                <Card size="small" style={{ marginTop: 8 }}>
                  <Steps size="small" current={testStep === 'Acquiring token...' ? 0 : testStep === 'Testing API with token...' ? 1 : 0}>
                    <Step title="Acquire Token" description="Getting authentication token" />
                    <Step title="Test API" description="Testing API with token" />
                  </Steps>
                </Card>
              )}

              {testResult && (
                <Alert
                  message={testResult.message}
                  description={testResult.details}
                  type={testResult.success ? 'success' : 'error'}
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}

              {testResult && testResult.success && testResult.tokenData && (
                <Card size="small" title="Test Results" style={{ marginTop: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>✅ Token Acquisition: </Text>
                      <Text type="success">Successful</Text>
                    </div>
                    
                    {testResult.apiTested && (
                      <div>
                        <Text strong>✅ API Test: </Text>
                        <Text type="success">Successful</Text>
                      </div>
                    )}
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <div>
                      <Text strong>Token: </Text>
                      <Text code>{testResult.tokenData.token ? testResult.tokenData.token.substring(0, 50) + '...' : 'N/A'}</Text>
                    </div>
                    {testResult.tokenData.expiresIn && (
                      <div>
                        <Text strong>Expires In: </Text>
                        <Text>{testResult.tokenData.expiresIn} seconds</Text>
                      </div>
                    )}
                    {testResult.tokenData.refreshToken && (
                      <div>
                        <Text strong>Refresh Token: </Text>
                        <Text code>{testResult.tokenData.refreshToken.substring(0, 30) + '...'}</Text>
                      </div>
                    )}
                    
                    {testResult.apiResponse && (
                      <div>
                        <Text strong>API Response: </Text>
                        <Text type="secondary">
                          {typeof testResult.apiResponse === 'object' 
                            ? 'JSON response received' 
                            : 'Response received'}
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
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
