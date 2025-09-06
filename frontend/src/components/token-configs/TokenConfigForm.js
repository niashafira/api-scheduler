import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Space, 
  Typography, 
  Divider, 
  Switch,
  message,
  Collapse,
  InputNumber,
  Radio,
  Alert,
  Steps,
  Card
} from 'antd';
import { 
  PlusOutlined, 
  LinkOutlined, 
  LockOutlined, 
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { apiService, jsonPath } from '../../utils/apiService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Step } = Steps;

const TokenConfigForm = ({ initialData, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testStep, setTestStep] = useState('');

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        endpoint: initialData.endpoint,
        method: initialData.method,
        tokenPath: initialData.tokenPath,
        expiresInPath: initialData.expiresInPath,
        refreshTokenPath: initialData.refreshTokenPath || '',
        expiresIn: initialData.expiresIn || 3600,
        refreshEnabled: initialData.refreshEnabled || false,
        body: initialData.body || '',
      });
      setHeaders(initialData.headers || [{ key: '', value: '' }]);
    }
  }, [initialData, form]);

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
      
      const formValues = form.getFieldsValue();
      if (!formValues.endpoint) {
        throw new Error('Token endpoint is required');
      }
      if (!formValues.tokenPath) {
        throw new Error('Token field path is required');
      }

      // Step 1: Test token acquisition
      setTestStep('Acquiring token...');
      const tokenConfig = {
        endpoint: formValues.endpoint,
        method: formValues.method,
        headers: headers.filter(h => h.key && h.value),
        body: formValues.body,
        tokenPath: formValues.tokenPath,
        expiresInPath: formValues.expiresInPath,
        refreshTokenPath: formValues.refreshTokenPath,
      };

      const response = await apiService.testTokenAcquisition(tokenConfig);
      console.log('Token response:', response);
      
      const tokenData = jsonPath.extractTokenData(response, tokenConfig);
      
      if (!tokenData.isValid) {
        throw new Error(`No valid token found at path: ${formValues.tokenPath}`);
      }
      
      setTestResult({ 
        success: true, 
        message: 'Token acquisition successful!',
        details: `Token: ${tokenData.token ? tokenData.token.substring(0, 20) + '...' : 'N/A'}`,
        tokenData
      });
      message.success('Token acquisition test successful!');
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

  const handleSubmit = (values) => {
    const formData = {
      ...values,
      headers: headers.filter(h => h.key && h.value),
    };
    console.log('Token config form data:', formData);
    onSubmit(formData);
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: '',
          endpoint: '',
          method: 'POST',
          tokenPath: 'access_token',
          expiresInPath: 'expires_in',
          expiresIn: 3600,
          refreshEnabled: false,
        }}
      >
        <Form.Item
          name="name"
          label="Configuration Name"
          rules={[{ required: true, message: 'Please enter a name for this token configuration' }]}
        >
          <Input placeholder="My Token Configuration" prefix={<KeyOutlined />} />
        </Form.Item>

        <Form.Item
          name="endpoint"
          label="Token Endpoint URL"
          rules={[
            { required: true, message: 'Please enter the token endpoint URL' },
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input 
            placeholder="https://api.example.com/oauth/token" 
            prefix={<LinkOutlined />} 
          />
        </Form.Item>

        <Form.Item
          name="method"
          label="Request Method"
        >
          <Radio.Group>
            <Radio value="POST">POST</Radio>
            <Radio value="GET">GET</Radio>
            <Radio value="PUT">PUT</Radio>
          </Radio.Group>
        </Form.Item>

        <Divider orientation="left">Token Request Headers</Divider>
        
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
          name="body"
          label="Request Body (JSON)"
          tooltip="JSON body for token request. Use {{variable}} for dynamic values."
        >
          <Input.TextArea 
            rows={4}
            placeholder='{"grant_type": "client_credentials", "client_id": "{{client_id}}", "client_secret": "{{client_secret}}"}'
          />
        </Form.Item>

        <Divider orientation="left">Token Response Configuration</Divider>

        <Form.Item
          name="tokenPath"
          label="Token Field Path"
          rules={[{ required: true, message: 'Please enter token field path' }]}
          tooltip="JSON path to access token in response (e.g., access_token, data.token)"
        >
          <Input placeholder="access_token" />
        </Form.Item>

        <Form.Item
          name="expiresInPath"
          label="Expires In Field Path"
          tooltip="JSON path to token expiration time in response (e.g., expires_in, data.expires_in)"
        >
          <Input placeholder="expires_in" />
        </Form.Item>

        <Form.Item
          name="expiresIn"
          label="Default Expires In (seconds)"
          tooltip="Default token expiration time if not provided in response"
        >
          <InputNumber 
            min={60}
            max={86400}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="refreshTokenPath"
          label="Refresh Token Field Path (Optional)"
          tooltip="JSON path to refresh token in response"
        >
          <Input placeholder="refresh_token" />
        </Form.Item>

        <Form.Item
          name="refreshEnabled"
          label="Enable Token Refresh"
          valuePropName="checked"
          tooltip="Automatically refresh token when it expires"
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
            {testingConnection ? (testStep || 'Testing...') : 'Test Token Acquisition'}
          </Button>
          
          {testingConnection && (
            <Card size="small" style={{ marginTop: 8 }}>
              <Steps size="small" current={testStep === 'Acquiring token...' ? 0 : 0}>
                <Step title="Acquire Token" description="Getting authentication token" />
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
            <Card size="small" title="Token Information" style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
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
              </Space>
            </Card>
          )}
        </Space>

        <Divider />

        <Form.Item>
          <Space>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {initialData ? 'Update Configuration' : 'Create Configuration'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default TokenConfigForm;
