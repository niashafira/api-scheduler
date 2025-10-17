import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Typography,
  Divider,
  Switch,
  message,
  Tabs,
  Alert,
  Radio,
  Tag,
  Steps
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  CodeOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { apiService, jsonPath } from '../../utils/apiService';
import apiSourceApi from '../../services/apiSourceApi';
import apiRequestApi from '../../services/apiRequestApi';
import { ApiSource, ApiRequest, Header, PathParam, QueryParam, TestResult } from '../../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Step } = Steps;

interface RequestStepProps {
  onNext?: (data: any) => void;
  onPrevious?: () => void;
  sourceData?: ApiSource | null;
  initialData?: ApiRequest | null;
  isEditMode?: boolean;
}


const RequestStep: React.FC<RequestStepProps> = ({ onNext, onPrevious, sourceData, initialData = null, isEditMode = false }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('path');
  const [pathParams, setPathParams] = useState<PathParam[]>([]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [requestBody, setRequestBody] = useState<string>('');
  const [testingRequest, setTestingRequest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [apiSource, setApiSource] = useState<ApiSource | null>(null);
  const [endpointPath, setEndpointPath] = useState<string>('');
  const [httpMethod, setHttpMethod] = useState<string>('GET');
  const [bodyFormat, setBodyFormat] = useState<string>('json');
  const [loading, setLoading] = useState<boolean>(false);
  const [testStep, setTestStep] = useState<string>('');

  // Fetch API source data when component mounts
  useEffect(() => {
    if (sourceData && sourceData.id) {
      fetchApiSource(sourceData.id);
    }
  }, [sourceData]);

  // Populate form with initial data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      populateFormWithInitialData();
    }
  }, [isEditMode, initialData]);

  const populateFormWithInitialData = (): void => {
    if (!initialData) return;

    // Set form values
    form.setFieldsValue({
      name: initialData.name || '',
    });

    // Set request configuration
    setHttpMethod(initialData.method || 'GET');
    setEndpointPath(initialData.path || '');
    setBodyFormat(initialData.bodyFormat || 'json');
    setRequestBody(initialData.body || '');

    // Set parameters and headers
    if (initialData.pathParams && Array.isArray(initialData.pathParams)) {
      setPathParams(initialData.pathParams.length > 0 ? initialData.pathParams : [{ name: '', value: '', required: true }]);
    } else {
      setPathParams([{ name: '', value: '', required: true }]);
    }

    if (initialData.queryParams && Array.isArray(initialData.queryParams)) {
      setQueryParams(initialData.queryParams.length > 0 ? initialData.queryParams : [{ name: '', value: '', required: false }]);
    } else {
      setQueryParams([{ name: '', value: '', required: false }]);
    }

    if (initialData.headers && Array.isArray(initialData.headers)) {
      setHeaders(initialData.headers.length > 0 ? initialData.headers : [{ key: '', value: '' }]);
    } else {
      setHeaders([{ key: '', value: '' }]);
    }
  };

  const fetchApiSource = async (id: number): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiSourceApi.getApiSource(id);
      
      // If token-based auth, fetch the token config details
      let apiSourceData = response.data;
      
      if (apiSourceData && apiSourceData.authType === 'token' && apiSourceData.tokenConfigId) {
        try {
          // Fetch token config details
          const tokenConfigResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/token-configs/${apiSourceData.tokenConfigId}`);
          const tokenConfigData = await tokenConfigResponse.json();
          
          if (tokenConfigData.success && tokenConfigData.data) {
            // Add token config to the API source data
            (apiSourceData as any).tokenConfig = tokenConfigData.data;
          }
        } catch (tokenError) {
          console.error('Failed to fetch token configuration:', tokenError);
        }
      }
      
      setApiSource(apiSourceData || null);
      
      // Initialize headers from source if available
      if (apiSourceData && apiSourceData.headers && Array.isArray(apiSourceData.headers)) {
        setHeaders(apiSourceData.headers);
      }
    } catch (error) {
      console.error('Failed to fetch API source:', error);
      message.error('Failed to load API source details');
    } finally {
      setLoading(false);
    }
  };

  const addPathParam = (): void => {
    setPathParams([...pathParams, { name: '', value: '', required: true }]);
  };

  const removePathParam = (index: number): void => {
    const updatedParams = [...pathParams];
    updatedParams.splice(index, 1);
    setPathParams(updatedParams);
  };

  const updatePathParam = (index: number, field: keyof PathParam, value: string | boolean): void => {
    const updatedParams = [...pathParams];
    (updatedParams[index] as any)[field] = value;
    setPathParams(updatedParams);
  };

  const addQueryParam = (): void => {
    setQueryParams([...queryParams, { name: '', value: '', required: false }]);
  };

  const removeQueryParam = (index: number): void => {
    const updatedParams = [...queryParams];
    updatedParams.splice(index, 1);
    setQueryParams(updatedParams);
  };

  const updateQueryParam = (index: number, field: keyof QueryParam, value: string | boolean): void => {
    const updatedParams = [...queryParams];
    (updatedParams[index] as any)[field] = value;
    setQueryParams(updatedParams);
  };

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

  const buildFullUrl = (): string => {
    if (!apiSource || !apiSource.baseUrl) return '';
    return apiService.buildUrl(
      apiSource.baseUrl,
      endpointPath,
      pathParams,
      queryParams
    );
  };

  const testRequest = async (): Promise<void> => {
    try {
      setTestingRequest(true);
      setTestResult(null);
      setTestStep('');
      
      // Validate form first
      await form.validateFields();
      
      const fullUrl = buildFullUrl();
      if (!fullUrl) {
        throw new Error('Invalid URL. Please check your endpoint configuration.');
      }
      
      // Build request options using shared helper
      const options = apiService.buildRequestOptions(
        httpMethod,
        bodyFormat as 'json' | 'form' | 'raw',
        requestBody,
        headers
      );
      
      // Handle token-based authentication
      if (apiSource && apiSource.authType === 'token' && (apiSource as any).tokenConfig) {
        setTestStep('Acquiring token...');
        
        try {
          // Get the token configuration
          const tokenConfigId = apiSource.tokenConfigId;
          if (!tokenConfigId) {
            throw new Error('No token configuration associated with this API source');
          }
          
          // Fetch the token configuration details
          const tokenConfig = (apiSource as any).tokenConfig;
          const tokenConfigResponse = await apiService.testTokenAcquisition({
            endpoint: tokenConfig.endpoint,
            method: tokenConfig.method,
            headers: tokenConfig.headers || [],
            body: tokenConfig.body,
            tokenPath: tokenConfig.tokenPath,
            expiresInPath: tokenConfig.expiresInPath,
            refreshTokenPath: tokenConfig.refreshTokenPath
          });
          
          // Extract token from response
          const tokenData = jsonPath.extractTokenData(tokenConfigResponse.fullResponse, {
            tokenPath: tokenConfig.tokenPath,
            expiresInPath: tokenConfig.expiresInPath,
            refreshTokenPath: tokenConfig.refreshTokenPath
          });
          
          if (!tokenData.isValid) {
            throw new Error(`Failed to acquire token from path: ${tokenConfig.tokenPath}`);
          }
          
          console.log('Token acquired successfully:', tokenData);
          
          // Add token to request headers
          // Ensure headers is a record before assigning
          (options.headers as Record<string, string>)['Authorization'] = `Bearer ${tokenData.token}`;
          
          setTestStep('Testing API with token...');
        } catch (tokenError) {
          throw new Error(`Token acquisition failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
        }
      }
      
      // Make the test request
      const response = await apiService.testCustomRequest(fullUrl, options as any);
      
      // Prepare test result
      const result: TestResult = {
        success: true,
        statusCode: response.status,
        data: response.data,
        headers: response.headers,
        message: `Request successful (${response.status})`,
      };
      
      // If token-based auth, include token info
      if (apiSource && apiSource.authType === 'token' && (options.headers as Record<string, string>)['Authorization']) {
        result.tokenUsed = true;
        // Extract token from Authorization header (Bearer token)
        const token = (options.headers as Record<string, string>)['Authorization'].replace('Bearer ', '');
        result.token = token;
      }
      
      setTestResult(result);
      
      message.success('Test request completed successfully');
    } catch (error) {
      console.error('Test request failed:', error);

      setTestResult({
        success: false,
        statusCode: (error as any)?.response?.status ?? null,
        data: (error as any)?.response?.data ?? null,
        headers: (error as any)?.response?.headers ?? null,
        message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      message.error('Test request failed');
    } finally {
      setTestingRequest(false);
      setTestStep('');
    }
  };

  const handleSubmit = async (values: any): Promise<void> => {
    try {
      // Process form values
      const formData = {
        apiSourceId: sourceData?.id,
        name: values.name || `${httpMethod} ${endpointPath || '/'}`,
        method: httpMethod as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        path: endpointPath,
        pathParams: pathParams.filter(p => p.name),
        queryParams: queryParams.filter(p => p.name),
        headers: headers.filter(h => h.key && h.value),
        body: requestBody,
        bodyFormat: bodyFormat as 'json' | 'form' | 'raw',
        status: 'active',
      };
      
      console.log('Request configuration to save:', formData);
      
      let response;
      if (isEditMode && initialData && initialData.id) {
        // Update existing API request
        response = await apiRequestApi.updateApiRequest(initialData.id, formData);
        console.log('API request updated:', response);
        message.success('API request updated successfully!');
      } else {
        // Create new API request
        response = await apiRequestApi.createApiRequest(formData);
        console.log('API request created:', response);
        message.success('API request created successfully!');
      }
      
      // Move to next step with the request data
      if (onNext) onNext({ 
        ...formData, 
        id: response.data?.id,
        apiSource: apiSource
      });
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} API request:`, error);
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} API request: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <Card title={<Title level={4}><ApiOutlined /> Step 2: Define API Request</Title>} bordered={false}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading source details...</div>
      ) : apiSource ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            method: 'GET',
            path: '',
            bodyFormat: 'json',
          }}
        >
          <Alert
            message="API Source Selected"
            description={
              <Space direction="vertical">
                <div><Text strong>Name:</Text> {apiSource.name}</div>
                <div><Text strong>Base URL:</Text> <Text code>{apiSource.baseUrl}</Text></div>
                <div><Text strong>Auth Type:</Text> <Tag color="blue">{apiSource.authType || 'None'}</Tag></div>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form.Item
            name="name"
            label="Request Name"
            tooltip="A descriptive name for this API request"
          >
            <Input 
              placeholder={`${httpMethod} ${endpointPath || '/'}`}
              prefix={<ApiOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <Text strong>HTTP Method</Text>
                <Text type="secondary">(Select the HTTP method for this request)</Text>
              </Space>
            }
          >
            <Radio.Group 
              value={httpMethod} 
              onChange={(e) => setHttpMethod(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="GET">GET</Radio.Button>
              <Radio.Button value="POST">POST</Radio.Button>
              <Radio.Button value="PUT">PUT</Radio.Button>
              <Radio.Button value="PATCH">PATCH</Radio.Button>
              <Radio.Button value="DELETE">DELETE</Radio.Button>
              <Radio.Button value="HEAD">HEAD</Radio.Button>
              <Radio.Button value="OPTIONS">OPTIONS</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <Text strong>Endpoint Path</Text>
                <Text type="secondary">(Relative to the base URL)</Text>
              </Space>
            }
            rules={[{ required: true, message: 'Please enter the endpoint path' }]}
          >
            <Input
              placeholder="/api/v1/resource/{id}"
              value={endpointPath}
              onChange={(e) => setEndpointPath(e.target.value)}
              addonBefore={apiSource.baseUrl}
            />
          </Form.Item>

          <Divider orientation="left">Request Configuration</Divider>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Path Parameters" key="path">
              <Alert
                message="Path Parameters"
                description="Define parameters that are part of the URL path. Use {paramName} in your endpoint path to define where these parameters should be inserted."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {pathParams.map((param, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    label="Name"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="id"
                      value={param.name}
                      onChange={(e) => updatePathParam(index, 'name', e.target.value)}
                      style={{ width: 150 }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Value"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="123"
                      value={param.value}
                      onChange={(e) => updatePathParam(index, 'value', e.target.value)}
                      style={{ width: 150 }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Required"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch
                      checked={param.required}
                      onChange={(checked) => updatePathParam(index, 'required', checked)}
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    onClick={() => removePathParam(index)}
                    icon={<DeleteOutlined />}
                  />
                </Space>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={addPathParam}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Path Parameter
                </Button>
              </Form.Item>
            </TabPane>

            <TabPane tab="Query Parameters" key="query">
              <Alert
                message="Query Parameters"
                description="Define parameters that will be added to the URL as query string (?param1=value1&param2=value2)."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {queryParams.map((param, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    label="Name"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="page"
                      value={param.name}
                      onChange={(e) => updateQueryParam(index, 'name', e.target.value)}
                      style={{ width: 150 }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Value"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="1"
                      value={param.value}
                      onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                      style={{ width: 150 }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Required"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch
                      checked={param.required}
                      onChange={(checked) => updateQueryParam(index, 'required', checked)}
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    onClick={() => removeQueryParam(index)}
                    icon={<DeleteOutlined />}
                  />
                </Space>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={addQueryParam}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Query Parameter
                </Button>
              </Form.Item>
            </TabPane>

            <TabPane tab="Headers" key="headers">
              <Alert
                message="Request Headers"
                description="Define additional HTTP headers to send with the request. Headers from the API source configuration will be included automatically."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {headers.map((header, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    label="Name"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Content-Type"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      style={{ width: 200 }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Value"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="application/json"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      style={{ width: 200 }}
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    onClick={() => removeHeader(index)}
                    icon={<DeleteOutlined />}
                  />
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
            </TabPane>

            <TabPane tab="Body" key="body" disabled={!['POST', 'PUT', 'PATCH'].includes(httpMethod)}>
              <Alert
                message="Request Body"
                description="Define the body content to send with the request. Only applicable for POST, PUT, and PATCH methods."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item label="Body Format">
                <Radio.Group 
                  value={bodyFormat} 
                  onChange={(e) => setBodyFormat(e.target.value)}
                >
                  <Radio.Button value="json">JSON</Radio.Button>
                  <Radio.Button value="form">Form Data</Radio.Button>
                  <Radio.Button value="text">Raw Text</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Request Body">
                <TextArea
                  rows={10}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder={
                    bodyFormat === 'json' 
                      ? '{\n  "key": "value",\n  "array": [1, 2, 3]\n}'
                      : bodyFormat === 'form'
                      ? 'key1=value1&key2=value2'
                      : 'Raw request body'
                  }
                />
              </Form.Item>

              {bodyFormat === 'json' && (
                <Form.Item>
                  <Button 
                    type="default" 
                    onClick={() => {
                      try {
                        const formatted = JSON.stringify(JSON.parse(requestBody || '{}'), null, 2);
                        setRequestBody(formatted);
                      } catch (e) {
                        message.error('Invalid JSON format');
                      }
                    }}
                    icon={<CodeOutlined />}
                  >
                    Format JSON
                  </Button>
                </Form.Item>
              )}
            </TabPane>
          </Tabs>

          <Divider />

          <Card title="Full Request URL Preview" size="small" style={{ marginBottom: 16 }}>
            <Text code copyable>{buildFullUrl()}</Text>
          </Card>

          <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
            <Button
              type="primary"
              onClick={testRequest}
              loading={testingRequest}
              icon={<SendOutlined />}
            >
              {testingRequest ? (testStep || 'Testing...') : 'Test Request'}
            </Button>
            
            {testingRequest && apiSource && apiSource.authType === 'token' && (
              <Card size="small" style={{ marginTop: 8 }}>
                <Steps size="small" current={testStep === 'Acquiring token...' ? 0 : testStep === 'Testing API with token...' ? 1 : 0}>
                  <Step title="Acquire Token" description="Getting authentication token" />
                  <Step title="Test API" description="Testing API with token" />
                </Steps>
              </Card>
            )}

            {testResult && (
              <Card 
                title={
                  <Space>
                    {testResult.success 
                      ? <CheckCircleOutlined style={{ color: 'green' }} /> 
                      : <CloseCircleOutlined style={{ color: 'red' }} />
                    }
                    <span>Test Result</span>
                  </Space>
                } 
                size="small"
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Status: </Text>
                  <Tag color={testResult.success ? 'success' : 'error'}>
                    {testResult.success ? `Success (${testResult.statusCode})` : 'Failed'}
                  </Tag>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Message: </Text>
                  <Text>{testResult.message}</Text>
                </div>
                
                {testResult.tokenUsed && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Authentication: </Text>
                    <Tag color="blue">Bearer Token</Tag>
                    {testResult.token && (
                      <div style={{ marginTop: 4 }}>
                        <Text strong>Token: </Text>
                        <Text code>{testResult.token.substring(0, 20)}...</Text>
                      </div>
                    )}
                  </div>
                )}
                
                {testResult.data && (
                  <div>
                    <Text strong>Response Data:</Text>
                    <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: 8 }}>
                      <pre style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                        {typeof testResult.data === 'object' 
                          ? JSON.stringify(testResult.data, null, 2) 
                          : testResult.data
                        }
                      </pre>
                    </div>
                  </div>
                )}
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
      ) : (
        <Alert
          message="No API Source Selected"
          description="Please go back and select an API source first."
          type="error"
          showIcon
        />
      )}
    </Card>
  );
};

export default RequestStep;
