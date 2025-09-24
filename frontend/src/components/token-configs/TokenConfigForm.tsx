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
import { TokenConfig, Header } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Step } = Steps;

interface TokenConfigFormProps {
  initialData?: TokenConfig | null;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

const TokenConfigForm: React.FC<TokenConfigFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }]);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testStep, setTestStep] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        endpoint: (initialData as any).endpoint || initialData.tokenUrl || '',
        method: (initialData as any).method || 'POST',
        tokenPath: (initialData as any).tokenPath || 'access_token',
        expiresInPath: (initialData as any).expiresInPath || 'expires_in',
        refreshTokenPath: initialData.refreshTokenPath || (initialData as any).refreshTokenPath || '',
        expiresIn: (initialData as any).expiresIn || 3600,
        refreshEnabled: (initialData as any).refreshEnabled || false,
        body: (initialData as any).body || '',
      });
      setHeaders(((initialData as any).headers as Header[]) || initialData.headers || [{ key: '', value: '' }]);
    }
  }, [initialData, form]);

  const addHeader = (): void => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number): void => {
    const updatedHeaders = [...headers];
    updatedHeaders.splice(index, 1);
    setHeaders(updatedHeaders);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string): void => {
    const updatedHeaders = [...headers];
    updatedHeaders[index][field] = value;
    setHeaders(updatedHeaders);
  };

  const testConnection = async (): Promise<void> => {
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
        bodyFormat: formValues.bodyFormat || 'json',
        tokenPath: formValues.tokenPath,
        expiresInPath: formValues.expiresInPath,
        refreshTokenPath: formValues.refreshTokenPath,
      };

      const response = await apiService.testTokenAcquisition(tokenConfig);
      console.log('Token response:', response);
      
      setTestResult({ 
        success: true, 
        message: 'Token acquisition successful!',
        details: `Token: ${response.token ? response.token.substring(0, 20) + '...' : 'N/A'}`,
        tokenData: response
      });
      message.success('Token acquisition test successful!');
    } catch (error: any) {
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

  const handleSubmit = (values: any): void => {
    const filteredHeaders = headers.filter(h => h.key && h.value);
    const hasContentType = filteredHeaders.some(h => h.key.toLowerCase() === 'content-type');
    const desiredContentType = (values.bodyFormat === 'form') 
      ? 'application/x-www-form-urlencoded' 
      : 'application/json';

    const finalHeaders = hasContentType 
      ? filteredHeaders 
      : [...filteredHeaders, { key: 'Content-Type', value: desiredContentType }];

    const formData = {
      ...values,
      headers: finalHeaders,
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
          bodyFormat: 'json',
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

        <Form.Item
          name="bodyFormat"
          label="Body Format"
          tooltip="Choose how to encode the request body"
        >
          <Radio.Group>
            <Radio value="json">JSON</Radio>
            <Radio value="form">x-www-form-urlencoded</Radio>
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
          shouldUpdate={(prev, curr) => prev.bodyFormat !== curr.bodyFormat}
          noStyle
        >
          {() => {
            const format = form.getFieldValue('bodyFormat');
            const label = format === 'form' ? 'Request Body (Form or key=value&k2=v2)' : 'Request Body (JSON)';
            const placeholder = format === 'form'
              ? 'grant_type=client_credentials&client_id={{client_id}}&client_secret={{client_secret}}\nOR as JSON: {"grant_type":"client_credentials","client_id":"..."}'
              : '{"grant_type": "client_credentials", "client_id": "{{client_id}}", "client_secret": "{{client_secret}}"}';
            return (
              <Form.Item
                name="body"
                label={label}
                tooltip={format === 'form' ? 'Provide key=value pairs or JSON; will be urlencoded' : 'Use {{variable}} for dynamic values.'}
              >
                <Input.TextArea rows={4} placeholder={placeholder} />
              </Form.Item>
            );
          }}
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
