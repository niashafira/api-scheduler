import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Typography,
  Divider,
  Table,
  Tag,
  message,
  Tabs,
  Alert,
  Select,
  Switch,
  Tooltip,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { apiService, jsonPath } from '../../utils/apiService';
import apiExtractApi from '../../services/apiExtractApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const ExtractStep = ({ onNext, onPrevious, sourceData, requestData, initialData = null, isEditMode = false }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('preview');
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractionPaths, setExtractionPaths] = useState([
    { name: 'items', path: 'data', description: 'Main data array', required: true, dataType: 'array' }
  ]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [extractionPreview, setExtractionPreview] = useState(null);
  const [extractionError, setExtractionError] = useState(null);
  const [rootArrayPath, setRootArrayPath] = useState('');
  const [primaryKeyFields, setPrimaryKeyFields] = useState([]);
  const [dataTypes] = useState([
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'array', label: 'Array' },
    { value: 'object', label: 'Object' }
  ]);

  // Fetch test response data when component mounts
  useEffect(() => {
    console.log('ExtractStep useEffect - requestData:', requestData);
    console.log('ExtractStep useEffect - sourceData:', sourceData);
    let sourceDataBaseUrl = sourceData.baseUrl;
    
    if (requestData && requestData.id && sourceData && sourceDataBaseUrl) {
      console.log('ExtractStep - Calling fetchTestResponse');
      fetchTestResponse();
    } else {
      console.log('ExtractStep - Not calling fetchTestResponse, missing data:', {
        requestData: !!requestData,
        requestDataId: requestData?.id,
        sourceData: !!sourceData,
        sourceDataBaseUrl: sourceDataBaseUrl
      });
    }
  }, [requestData, sourceData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form with initial data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      populateFormWithInitialData();
    }
  }, [isEditMode, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const populateFormWithInitialData = () => {
    if (!initialData) return;

    // Set form values
    form.setFieldsValue({
      name: initialData.name || '',
      nullValueHandling: initialData.null_value_handling || 'keep',
      dateFormat: initialData.date_format || '',
      transformScript: initialData.transform_script || ''
    });

    // Set extraction configuration
    setRootArrayPath(initialData.root_array_path || '');
    setPrimaryKeyFields(initialData.primary_key_fields || []);

    // Set extraction paths
    if (initialData.extraction_paths && Array.isArray(initialData.extraction_paths)) {
      setExtractionPaths(initialData.extraction_paths.length > 0 ? initialData.extraction_paths : [{
        name: 'items',
        path: 'data',
        description: 'Main data array',
        required: true,
        dataType: 'array'
      }]);
    }
  };

  const fetchTestResponse = async () => {
    try {
      setLoading(true);
      
      console.log('fetchTestResponse - requestData:', requestData);
      console.log('fetchTestResponse - sourceData:', sourceData);
      
      if (!requestData || !requestData.id) {
        throw new Error('No request data available');
      }
      
      // Build the URL first
      const url = buildRequestUrl();
      console.log('fetchTestResponse - built URL:', url);
      
      // Build request options with token authentication if needed
      let requestOptions = buildRequestOptions();
      
      // Handle token-based authentication
      if (sourceData && sourceData.authType === 'token' && sourceData.tokenConfigId) {
        try {
          // Fetch token configuration details
          const tokenConfigResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/token-configs/${sourceData.tokenConfigId}`);
          const tokenConfigData = await tokenConfigResponse.json();
          
          if (tokenConfigData.success && tokenConfigData.data) {
            const tokenConfig = tokenConfigData.data;
            
            // Acquire token
            const tokenResponse = await apiService.testTokenAcquisition({
              endpoint: tokenConfig.endpoint,
              method: tokenConfig.method,
              headers: tokenConfig.headers || [],
              body: tokenConfig.body,
              tokenPath: tokenConfig.tokenPath,
              expiresInPath: tokenConfig.expiresInPath,
              refreshTokenPath: tokenConfig.refreshTokenPath
            });
            
            // Extract token from response
            const tokenData = jsonPath.extractTokenData(tokenResponse.fullResponse, {
              tokenPath: tokenConfig.tokenPath,
              expiresInPath: tokenConfig.expiresInPath,
              refreshTokenPath: tokenConfig.refreshTokenPath
            });
            
            if (!tokenData.isValid) {
              throw new Error(`Failed to acquire token from path: ${tokenConfig.tokenPath}`);
            }
            
            // Add token to request headers
            requestOptions.headers['Authorization'] = `Bearer ${tokenData.token}`;
          }
        } catch (tokenError) {
          console.error('Token acquisition failed:', tokenError);
          throw new Error(`Token acquisition failed: ${tokenError.message}`);
        }
      }
      
      // Make a real API call to test the request
      console.log('fetchTestResponse - Making API call to:', url);
      const response = await apiService.testCustomRequest(
        url, 
        requestOptions
      );
      
      // Check if the response is HTML (often happens with CORS issues or when hitting web pages)
      const isHtml = typeof response.data === 'string' && 
                     (response.data.trim().startsWith('<!DOCTYPE') || 
                      response.data.trim().startsWith('<html'));
      
      if (isHtml) {
        console.warn('Received HTML response instead of JSON');
        throw new Error('Received HTML response instead of JSON. This might be due to CORS issues or the endpoint returning a web page instead of API data.');
      }
      
      // Process the response data
      const processedData = parseResponseData(response.data);
      setResponseData(processedData);
      
      // Auto-detect possible root array paths
      detectRootArrayPaths(processedData);
      
      message.success('API request executed successfully');
    } catch (error) {
      console.error('Failed to fetch test response:', error);
      message.error('Failed to load test response data: ' + error.message);
      
      // Fallback to mock data for development purposes
      const mockResponse = {
        status: 200,
        data: {
          data: [
            { id: 1, name: "Item 1", status: "active", createdAt: "2023-09-06T10:00:00Z" },
            { id: 2, name: "Item 2", status: "inactive", createdAt: "2023-09-05T09:30:00Z" },
            { id: 3, name: "Item 3", status: "active", createdAt: "2023-09-04T14:15:00Z" }
          ],
          pagination: {
            total: 3,
            per_page: 10,
            current_page: 1,
            total_pages: 1
          },
          meta: {
            request_id: "abc123",
            timestamp: "2023-09-06T12:00:00Z"
          }
        }
      };
      
      setResponseData(mockResponse.data);
      
      // Auto-detect possible root array paths
      detectRootArrayPaths(mockResponse.data);
    } finally {
      setLoading(false);
    }
  };
  
  // Parse and normalize response data
  const parseResponseData = (data) => {
    // If data is already an object, return it
    if (data !== null && typeof data === 'object') {
      return data;
    }
    
    // If data is a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        // If it's not valid JSON, return a simplified object
        return {
          rawContent: data.substring(0, 1000) + (data.length > 1000 ? '...' : ''),
          contentType: 'text/plain',
          length: data.length
        };
      }
    }
    
    // If data is undefined or null, return an empty object
    return { message: 'No data received' };
  };
  
  // Build the full request URL from the request data
  const buildRequestUrl = () => {
    console.log('buildRequestUrl - sourceData:', sourceData);
    console.log('buildRequestUrl - requestData:', requestData);
    
    if (!requestData || !sourceData) {
      console.log('buildRequestUrl - Missing data:', { requestData: !!requestData, sourceData: !!sourceData });
      return '';
    }
    
    // Get base URL from source
    let baseUrl = sourceData.baseUrl;
    console.log('buildRequestUrl - baseUrl:', baseUrl);
    
    // Check if baseUrl is valid (not localhost:3000 or empty)
    if (!baseUrl || baseUrl.includes('localhost:3000') || baseUrl === '') {
      console.error('buildRequestUrl - Invalid baseUrl:', baseUrl);
      throw new Error('Invalid or missing base URL in source data');
    }
    
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Get path from request
    let path = requestData.path || '';
    console.log('buildRequestUrl - path:', path);
    
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Replace path parameters with their values
    if (requestData.pathParams && Array.isArray(requestData.pathParams)) {
      requestData.pathParams.forEach(param => {
        if (param.name && param.value) {
          path = path.replace(`{${param.name}}`, encodeURIComponent(param.value));
        }
      });
    }
    
    // Build query string
    let queryString = '';
    if (requestData.queryParams && Array.isArray(requestData.queryParams)) {
      const queryParams = requestData.queryParams
        .filter(param => param.name)
        .map(param => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value || '')}`);
      
      if (queryParams.length > 0) {
        queryString = '?' + queryParams.join('&');
      }
    }
    
    const finalUrl = baseUrl + path + queryString;
    console.log('buildRequestUrl - finalUrl:', finalUrl);
    
    return finalUrl;
  };
  
  // Build the request options from the request data
  const buildRequestOptions = () => {
    if (!requestData) return { method: 'GET' };
    
    const options = {
      method: requestData.method || 'GET',
      headers: {
        // Add default headers for JSON
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    };
    
    // Add headers
    if (requestData.headers && Array.isArray(requestData.headers)) {
      requestData.headers.forEach(header => {
        if (header.key && header.value) {
          options.headers[header.key] = header.value;
        }
      });
    }
    
    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(options.method) && requestData.body) {
      if (requestData.bodyFormat === 'json') {
        try {
          options.body = JSON.parse(requestData.body);
        } catch (e) {
          options.body = requestData.body;
        }
      } else {
        options.body = requestData.body;
      }
    }
    
    return options;
  };

  const detectRootArrayPaths = (data) => {
    // Check if data is not a proper object (e.g., HTML response)
    if (!data || typeof data !== 'object' || data.rawContent) {
      setExtractionPaths([{
        name: 'data',
        path: '',
        description: 'Data field',
        required: true,
        dataType: 'string'
      }]);
      return;
    }
    
    // Find all paths that lead to arrays in the response
    const arrayPaths = [];
    const arrayPathsWithInfo = [];
    
    const findArrays = (obj, path = '') => {
      if (!obj) return;
      
      if (Array.isArray(obj)) {
        arrayPaths.push(path);
        
        // Store additional info about this array
        arrayPathsWithInfo.push({
          path: path,
          length: obj.length,
          sampleFields: obj.length > 0 ? Object.keys(obj[0] || {}).slice(0, 5) : [],
          depth: path.split('.').length,
          isNested: path.includes('.')
        });
      }
      
      if (typeof obj === 'object') {
        Object.keys(obj || {}).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          findArrays(obj[key], newPath);
        });
      }
    };
    
    try {
      findArrays(data);
    } catch (error) {
      console.error('Error detecting array paths:', error);
      // Set default extraction path on error
      setExtractionPaths([{
        name: 'data',
        path: '',
        description: 'Data field',
        required: true,
        dataType: 'string'
      }]);
      return;
    }
    
    // Sort array paths by a heuristic to find the most likely "main" data array
    // Prefer: arrays with objects inside, arrays with more items, arrays with common data fields
    arrayPathsWithInfo.sort((a, b) => {
      // Prefer arrays with items
      if (a.length > 0 && b.length === 0) return -1;
      if (a.length === 0 && b.length > 0) return 1;
      
      // Prefer arrays with sample fields (objects)
      if (a.sampleFields.length > 0 && b.sampleFields.length === 0) return -1;
      if (a.sampleFields.length === 0 && b.sampleFields.length > 0) return 1;
      
      // Common data field names that suggest this is the main data array
      const dataFieldNames = ['id', 'name', 'title', 'description', 'createdAt', 'updatedAt'];
      const aScore = a.sampleFields.filter(f => dataFieldNames.includes(f)).length;
      const bScore = b.sampleFields.filter(f => dataFieldNames.includes(f)).length;
      
      if (aScore !== bScore) return bScore - aScore;
      
      // Prefer paths with "data", "items", "results" in them
      const dataPathTerms = ['data', 'items', 'results', 'records', 'list'];
      const aHasDataTerm = dataPathTerms.some(term => a.path.includes(term));
      const bHasDataTerm = dataPathTerms.some(term => b.path.includes(term));
      
      if (aHasDataTerm && !bHasDataTerm) return -1;
      if (!aHasDataTerm && bHasDataTerm) return 1;
      
      // Prefer shorter paths
      return a.depth - b.depth;
    });
    
    // If we found array paths, suggest the best one as root array path
    if (arrayPathsWithInfo.length > 0) {
      const bestPath = arrayPathsWithInfo[0].path;
      setRootArrayPath(bestPath);
      
      // Get the array at this path
      const arrayData = jsonPath.getValue(data, bestPath);
      
      // Update the default extraction path for items
      let updatedPaths = [];
      
      if (Array.isArray(arrayData) && arrayData.length > 0 && typeof arrayData[0] === 'object') {
        // Create extraction paths for each field in the first array item
        updatedPaths = Object.keys(arrayData[0]).map((key, index) => {
          // Guess data type
          let dataType = 'string';
          const sampleValue = arrayData[0][key];
          
          if (typeof sampleValue === 'number') dataType = 'number';
          else if (typeof sampleValue === 'boolean') dataType = 'boolean';
          else if (Array.isArray(sampleValue)) dataType = 'array';
          else if (sampleValue instanceof Date || 
                  (typeof sampleValue === 'string' && 
                   /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(sampleValue))) {
            dataType = 'date';
          } else if (typeof sampleValue === 'object' && sampleValue !== null) dataType = 'object';
          
          // Guess if this might be a primary key
          const isPrimaryKey = key === 'id' || key.endsWith('_id') || key === 'key' || key === 'uid';
          
          return {
            name: key,
            path: `${key}`,
            description: `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}`,
            required: isPrimaryKey,
            dataType: dataType
          };
        });
        
        // If we found an ID field, set it as primary key
        const idField = updatedPaths.find(p => p.name === 'id');
        if (idField) {
          setPrimaryKeyFields(['id']);
        }
      } else {
        // Default extraction path
        updatedPaths = [{
          name: 'items',
          path: '',
          description: 'Main data array',
          required: true,
          dataType: 'array'
        }];
      }
      
      setExtractionPaths(updatedPaths);
    }
  };

  const addExtractionPath = () => {
    setExtractionPaths([
      ...extractionPaths,
      { name: '', path: '', description: '', required: false, dataType: 'string' }
    ]);
  };

  const removeExtractionPath = (index) => {
    const updatedPaths = [...extractionPaths];
    updatedPaths.splice(index, 1);
    setExtractionPaths(updatedPaths);
  };

  const updateExtractionPath = (index, field, value) => {
    const updatedPaths = [...extractionPaths];
    updatedPaths[index][field] = value;
    setExtractionPaths(updatedPaths);
  };

  const addPrimaryKeyField = (fieldName) => {
    if (fieldName && !primaryKeyFields.includes(fieldName)) {
      setPrimaryKeyFields([...primaryKeyFields, fieldName]);
    }
  };

  const removePrimaryKeyField = (fieldName) => {
    setPrimaryKeyFields(primaryKeyFields.filter(field => field !== fieldName));
  };

  const togglePrimaryKeyField = (fieldName) => {
    if (primaryKeyFields.includes(fieldName)) {
      removePrimaryKeyField(fieldName);
    } else {
      addPrimaryKeyField(fieldName);
    }
  };

  const testExtraction = (path, index) => {
    try {
      setSelectedPath(index);
      setExtractionError(null);
      
      if (!responseData) {
        setExtractionError('No response data available');
        return;
      }
      
      if (!path) {
        setExtractionError('Path cannot be empty');
        return;
      }
      
      // Get the root array data first if a root path is specified
      let dataToExtractFrom = responseData;
      if (rootArrayPath) {
        const rootData = jsonPath.getValue(responseData, rootArrayPath);
        if (Array.isArray(rootData) && rootData.length > 0) {
          // Use the first item in the array for extraction preview
          dataToExtractFrom = rootData[0];
        }
      }
      
      // Extract data using the provided path
      const extracted = jsonPath.getValue(dataToExtractFrom, path);
      
      if (extracted === undefined || extracted === null) {
        setExtractionError(`No data found at path: ${path}`);
        setExtractionPreview(null);
      } else {
        setExtractionPreview(extracted);
        
        // Update the data type based on the extracted value
        let detectedType = 'string';
        if (typeof extracted === 'number') detectedType = 'number';
        else if (typeof extracted === 'boolean') detectedType = 'boolean';
        else if (Array.isArray(extracted)) detectedType = 'array';
        else if (extracted instanceof Date || 
                (typeof extracted === 'string' && 
                 /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(extracted))) {
          detectedType = 'date';
        } else if (typeof extracted === 'object' && extracted !== null) detectedType = 'object';
        
        // Update the data type in the extraction paths
        if (extractionPaths[index].dataType !== detectedType) {
          const updatedPaths = [...extractionPaths];
          updatedPaths[index].dataType = detectedType;
          setExtractionPaths(updatedPaths);
        }
      }
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionError(`Error extracting data: ${error.message}`);
      setExtractionPreview(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Filter out empty extraction paths
      const filteredPaths = extractionPaths.filter(p => p.name && p.path);
      
      if (filteredPaths.length === 0) {
        message.error('At least one extraction path must be defined');
        return;
      }

      if (primaryKeyFields.length === 0) {
        message.error('At least one primary key field must be selected');
        return;
      }
      
      // Process form values
      const formData = {
        apiRequestId: requestData?.id,
        name: values.name,
        rootArrayPath: rootArrayPath,
        extractionPaths: filteredPaths,
        primaryKeyFields: primaryKeyFields,
        nullValueHandling: values.nullValueHandling || 'keep',
        dateFormat: values.dateFormat,
        transformScript: values.transformScript,
        status: 'active'
      };
      
      console.log('Extraction configuration to save:', formData);
      
      let response;
      if (isEditMode && initialData && initialData.id) {
        // Update existing API extract
        response = await apiExtractApi.updateApiExtract(initialData.id, formData);
        console.log('API extract updated:', response);
        message.success('Extraction configuration updated successfully!');
      } else {
        // Create new API extract
        response = await apiExtractApi.createApiExtract(formData);
        console.log('API extract created:', response);
        message.success('Extraction configuration saved successfully!');
      }
      
      // Move to next step with the extraction data
      if (onNext) {
        onNext({
          ...formData,
          id: response.data.id,
          apiRequest: requestData,
          apiSource: sourceData
        });
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'save'} extraction configuration:`, error);
      message.error(`Failed to ${isEditMode ? 'update' : 'save'} extraction configuration: ` + error.message);
    }
  };

  const renderJsonPreview = (data) => {
    if (!data) return <Empty description="No data available" />;
    
    // Handle HTML or text content
    if (data.rawContent && data.contentType) {
      return (
        <>
          <Alert
            message="Non-JSON Response Detected"
            description="The API returned a non-JSON response. This might be due to CORS issues, authentication problems, or the endpoint returning a web page instead of API data."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Content Type:</Text> {data.contentType}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Content Length:</Text> {data.length} characters
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Preview:</Text>
            </div>
            <pre style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4 }}>
              {data.rawContent}
            </pre>
          </div>
        </>
      );
    }
    
    // Handle standard JSON data
    return (
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        <pre style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  const extractionColumns = [
    {
      title: 'Field Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record, index) => (
        <Input
          placeholder="e.g., id, name, createdAt"
          value={text}
          onChange={(e) => updateExtractionPath(index, 'name', e.target.value)}
        />
      ),
    },
    {
      title: 'JSON Path',
      dataIndex: 'path',
      key: 'path',
      render: (text, record, index) => (
        <Input
          placeholder="e.g., data.id, results[0].name"
          value={text}
          onChange={(e) => updateExtractionPath(index, 'path', e.target.value)}
          addonAfter={
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => testExtraction(text, index)}
              size="small"
            />
          }
        />
      ),
    },
    {
      title: 'Data Type',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (text, record, index) => (
        <Select
          style={{ width: '100%' }}
          value={text}
          onChange={(value) => updateExtractionPath(index, 'dataType', value)}
        >
          {dataTypes.map(type => (
            <Option key={type.value} value={type.value}>{type.label}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      width: 80,
      render: (value, record, index) => (
        <Switch
          checked={value}
          onChange={(checked) => updateExtractionPath(index, 'required', checked)}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text, record, index) => (
        <Input
          placeholder="Field description"
          value={text}
          onChange={(e) => updateExtractionPath(index, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeExtractionPath(index)}
          disabled={index === 0} // Don't allow deleting the first row (main data array)
        />
      ),
    },
  ];

  return (
    <Card title={<Title level={4}><FileSearchOutlined /> Step 3: Extract Data</Title>} bordered={false}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading response data...</div>
        </div>
      ) : responseData ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: `Extract from ${requestData?.name || 'API'}`,
          }}
        >
          <Alert
            message="API Request Selected"
            description={
              <Space direction="vertical">
                <div><Text strong>Source:</Text> {sourceData?.name}</div>
                <div><Text strong>Request:</Text> {requestData?.name || `${requestData?.method} ${requestData?.path}`}</div>
                <div><Text strong>Method:</Text> <Tag color="blue">{requestData?.method}</Tag></div>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form.Item
            name="name"
            label="Extraction Name"
            tooltip="A descriptive name for this data extraction"
            rules={[{ required: true, message: 'Please enter a name for this extraction' }]}
          >
            <Input 
              placeholder="e.g., Extract Users, Product List"
              prefix={<FileSearchOutlined />}
            />
          </Form.Item>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Response Preview" key="preview">
              <Alert
                message="API Response"
                description="This is a sample response from the API. Use this to identify the paths to extract data from."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              {renderJsonPreview(responseData)}
            </TabPane>
            
            <TabPane tab="Data Extraction" key="extraction">
              <Alert
                message="Define Data Extraction"
                description="Specify the JSON paths to extract data from the API response. The first path should point to the main data array."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Form.Item
                name="rootArrayPath"
                label={
                  <span>
                    Root Array Path 
                    <Tooltip title="The JSON path to the main data array in the response">
                      <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                rules={[{ required: true, message: 'Please specify the root array path' }]}
              >
                <Input 
                  placeholder="e.g., data, results, items"
                  value={rootArrayPath}
                  onChange={(e) => setRootArrayPath(e.target.value)}
                  addonAfter={
                    <Button 
                      type="text" 
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        if (rootArrayPath) {
                          const extracted = jsonPath.getValue(responseData, rootArrayPath);
                          setSelectedPath(null);
                          setExtractionPreview(extracted);
                          if (extracted === undefined || extracted === null) {
                            setExtractionError(`No data found at path: ${rootArrayPath}`);
                          } else {
                            setExtractionError(null);
                          }
                        }
                      }}
                    />
                  }
                />
              </Form.Item>
              
              <Form.Item
                label={
                  <span>
                    Primary Key Fields
                    <Tooltip title="Select one or more fields to use as composite primary key for uniqueness. This helps avoid duplicate records when saving data.">
                      <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
              >
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">
                    Select fields that together form a unique identifier (e.g., year + month, id + type, etc.)
                  </Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {extractionPaths.filter(p => p.name).map((path, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                      <Switch
                        checked={primaryKeyFields.includes(path.name)}
                        onChange={() => togglePrimaryKeyField(path.name)}
                        style={{ marginRight: 8 }}
                      />
                      <Tag 
                        color={primaryKeyFields.includes(path.name) ? 'blue' : 'default'}
                        style={{ cursor: 'pointer' }}
                        onClick={() => togglePrimaryKeyField(path.name)}
                      >
                        {path.name}
                        {path.required && <span style={{ marginLeft: 4 }}>*</span>}
                      </Tag>
                    </div>
                  ))}
                </div>
                {primaryKeyFields.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Selected Primary Key Fields: </Text>
                    <Text code>{primaryKeyFields.join(' + ')}</Text>
                  </div>
                )}
              </Form.Item>
              
              <Divider orientation="left">Field Mappings</Divider>
              
              <Table
                dataSource={extractionPaths}
                columns={extractionColumns}
                pagination={false}
                rowKey={(record, index) => index.toString()}
                style={{ marginBottom: 16 }}
              />
              
              <Button
                type="dashed"
                onClick={addExtractionPath}
                block
                icon={<PlusOutlined />}
                style={{ marginBottom: 16 }}
              >
                Add Field Mapping
              </Button>
              
              {selectedPath !== null && (
                <Card 
                  title="Extraction Preview" 
                  size="small"
                  extra={
                    <Button
                      size="small"
                      icon={<CloseCircleOutlined />}
                      onClick={() => {
                        setSelectedPath(null);
                        setExtractionPreview(null);
                        setExtractionError(null);
                      }}
                    >
                      Close
                    </Button>
                  }
                >
                  {extractionError ? (
                    <Alert message={extractionError} type="error" showIcon />
                  ) : extractionPreview !== null ? (
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Path:</Text> <Text code>{extractionPaths[selectedPath]?.path}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Data Type:</Text> <Tag color="blue">{typeof extractionPreview}</Tag>
                      </div>
                      <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                        <pre style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                          {typeof extractionPreview === 'object' 
                            ? JSON.stringify(extractionPreview, null, 2) 
                            : extractionPreview?.toString()
                          }
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <Empty description="No preview available" />
                  )}
                </Card>
              )}
            </TabPane>
            
            <TabPane tab="Advanced Options" key="advanced">
              <Alert
                message="Advanced Extraction Options"
                description="Configure additional options for data extraction and transformation."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Form.Item
                name="nullValues"
                label="Null Value Handling"
                tooltip="How to handle null or missing values"
              >
                <Select defaultValue="keep">
                  <Option value="keep">Keep as null</Option>
                  <Option value="empty">Convert to empty string</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="dateFormat"
                label="Date Format"
                tooltip="Format for date/time fields"
              >
                <Input placeholder="e.g., YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
              
              <Form.Item
                name="transformScript"
                label="Transformation Script"
                tooltip="Optional JavaScript code to transform the extracted data"
              >
                <TextArea
                  rows={6}
                  placeholder="// Optional JavaScript code to transform the extracted data
// Example:
// data.forEach(item => {
//   item.fullName = item.firstName + ' ' + item.lastName;
// });"
                />
              </Form.Item>
            </TabPane>
          </Tabs>

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
          message="No Response Data Available"
          description="Please go back and select a valid API request first."
          type="error"
          showIcon
        />
      )}
    </Card>
  );
};

export default ExtractStep;
