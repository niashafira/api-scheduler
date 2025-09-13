import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Typography,
  Divider,
  Alert,
  Table,
  message,
  Tooltip,
  Switch
} from 'antd';
import {
  DatabaseOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { ApiSource, ApiRequest, ApiExtract } from '../../types';
import destinationApi from '../../services/destinationApi';

const { Title, Text } = Typography;

interface DestinationStepProps {
  onNext?: (data: any) => void;
  onPrevious?: () => void;
  sourceData?: ApiSource | null;
  requestData?: ApiRequest | null;
  extractData?: ApiExtract | null;
  initialData?: any;
  isEditMode?: boolean;
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue?: string;
  description?: string;
}


const DestinationStep: React.FC<DestinationStepProps> = ({ 
  onNext, 
  onPrevious, 
  sourceData, 
  requestData, 
  extractData, 
  initialData = null, 
  isEditMode = false 
}) => {
  const [form] = Form.useForm();
  const [tableName, setTableName] = useState<string>('');
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [includeRawPayload, setIncludeRawPayload] = useState<boolean>(true);
  const [includeIngestedAt, setIncludeIngestedAt] = useState<boolean>(true);

  // Data types for columns
  const dataTypes = [
    { value: 'VARCHAR', label: 'VARCHAR(255)', description: 'Variable-length string' },
    { value: 'TEXT', label: 'TEXT', description: 'Long text' },
    { value: 'INTEGER', label: 'INTEGER', description: 'Whole number' },
    { value: 'BIGINT', label: 'BIGINT', description: 'Large whole number' },
    { value: 'DECIMAL', label: 'DECIMAL(10,2)', description: 'Decimal number' },
    { value: 'BOOLEAN', label: 'BOOLEAN', description: 'True/False' },
    { value: 'DATE', label: 'DATE', description: 'Date only' },
    { value: 'TIMESTAMP', label: 'TIMESTAMP', description: 'Date and time' },
    { value: 'JSONB', label: 'JSONB', description: 'JSON data' },
    { value: 'UUID', label: 'UUID', description: 'Unique identifier' }
  ];

  // Initialize form and columns when component mounts
  useEffect(() => {
    console.log('DestinationStep useEffect - extractData:', extractData);
    console.log('DestinationStep useEffect - isEditMode:', isEditMode);
    console.log('DestinationStep useEffect - initialData:', initialData);
    
    if (isEditMode && initialData) {
      populateFormWithInitialData();
    } else {
      initializeColumnsFromExtractData();
    }
  }, [isEditMode, initialData, extractData]); // eslint-disable-line react-hooks/exhaustive-deps

  const populateFormWithInitialData = (): void => {
    if (!initialData) return;

    form.setFieldsValue({
      tableName: initialData.tableName || '',
      includeRawPayload: initialData.includeRawPayload !== false,
      includeIngestedAt: initialData.includeIngestedAt !== false
    });

    setTableName(initialData.tableName || '');
    setIncludeRawPayload(initialData.includeRawPayload !== false);
    setIncludeIngestedAt(initialData.includeIngestedAt !== false);
    setColumns(initialData.columns || []);
  };

  const initializeColumnsFromExtractData = (): void => {
    console.log('initializeColumnsFromExtractData - extractData:', extractData);
    
    if (!extractData || !extractData.extractionPaths) {
      console.log('No extractData or extractionPaths available');
      // Show sample columns when no extract data is available
      setColumns([
        {
          name: 'id',
          type: 'INTEGER',
          nullable: false,
          isPrimaryKey: true,
          isUnique: false,
          description: 'Primary key'
        },
        {
          name: 'name',
          type: 'VARCHAR(255)',
          nullable: false,
          isPrimaryKey: false,
          isUnique: false,
          description: 'Item name'
        }
      ]);
      return;
    }

    console.log('Extraction paths found:', extractData.extractionPaths);

    // Convert extraction paths to table columns
    const newColumns: TableColumn[] = extractData.extractionPaths.map((path: any) => ({
      name: path.name,
      type: mapDataTypeToSQL(path.dataType),
      nullable: !path.required,
      isPrimaryKey: extractData.primaryKeyFields?.includes(path.name) || false,
      isUnique: false,
      description: path.description || ''
    }));

    // Add system columns
    if (includeRawPayload) {
      newColumns.push({
        name: 'raw_payload',
        type: 'JSONB',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        description: 'Raw JSON payload from API response'
      });
    }

    if (includeIngestedAt) {
      newColumns.push({
        name: 'ingested_at',
        type: 'TIMESTAMP',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        description: 'Timestamp when data was ingested'
      });
    }

    setColumns(newColumns);
  };

  const mapDataTypeToSQL = (dataType: string): string => {
    const mapping: Record<string, string> = {
      'string': 'VARCHAR(255)',
      'number': 'INTEGER',
      'boolean': 'BOOLEAN',
      'date': 'TIMESTAMP',
      'array': 'JSONB',
      'object': 'JSONB'
    };
    return mapping[dataType] || 'VARCHAR(255)';
  };

  const handleTableNameChange = (e: any): void => {
    setTableName(e.target.value);
  };

  const addColumn = (): void => {
    const newColumn: TableColumn = {
      name: '',
      type: 'VARCHAR(255)',
      nullable: true,
      isPrimaryKey: false,
      isUnique: false,
      description: ''
    };
    setColumns([...columns, newColumn]);
  };

  const removeColumn = (index: number): void => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const updateColumn = (index: number, field: keyof TableColumn, value: any): void => {
    const newColumns = [...columns];
    (newColumns[index] as any)[field] = value;
    setColumns(newColumns);
  };

  const handleSubmit = async (values: any): Promise<void> => {
    try {
      // Validate columns
      const validColumns = columns.filter(col => col.name.trim() !== '');
      if (validColumns.length === 0) {
        message.error('At least one column must be defined');
        return;
      }

      // Check for primary key
      const hasPrimaryKey = validColumns.some(col => col.isPrimaryKey);
      if (!hasPrimaryKey) {
        message.error('At least one column must be marked as primary key');
        return;
      }

      const formData = {
        destinationType: 'new' as const,
        tableName: tableName,
        columns: validColumns,
        includeRawPayload: includeRawPayload,
        includeIngestedAt: includeIngestedAt,
        status: 'active',
        apiSourceId: sourceData?.id || null,
        apiRequestId: requestData?.id || null,
        apiExtractId: extractData?.id || null
      };

      console.log('Destination configuration to save:', formData);

      // Call the backend API to create the destination
      const response = await destinationApi.createDestination(formData);
      
      if (response.success) {
        message.success('Destination configuration saved successfully!');
        
        // Move to next step with the created destination data
        if (onNext) {
          onNext({
            ...formData,
            id: response.data.id,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt
          });
        }
      } else {
        message.error(response.message || 'Failed to save destination configuration');
      }
    } catch (error) {
      console.error('Failed to save destination configuration:', error);
      message.error('Failed to save destination configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const columnColumns = [
    {
      title: 'Column Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TableColumn, index: number) => (
        <Input
          placeholder="e.g., id, name, email"
          value={text}
          onChange={(e) => updateColumn(index, 'name', e.target.value)}
        />
      ),
    },
    {
      title: 'Data Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (text: string, record: TableColumn, index: number) => (
        <select
          value={text}
          onChange={(e) => updateColumn(index, 'type', e.target.value)}
          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
        >
          {dataTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      ),
    },
    {
      title: 'Nullable',
      dataIndex: 'nullable',
      key: 'nullable',
      width: 80,
      render: (value: boolean, record: TableColumn, index: number) => (
        <Switch
          checked={value}
          onChange={(checked) => updateColumn(index, 'nullable', checked)}
        />
      ),
    },
    {
      title: 'Primary Key',
      dataIndex: 'isPrimaryKey',
      key: 'isPrimaryKey',
      width: 100,
      render: (value: boolean, record: TableColumn, index: number) => (
        <Switch
          checked={value}
          onChange={(checked) => updateColumn(index, 'isPrimaryKey', checked)}
        />
      ),
    },
    {
      title: 'Unique',
      dataIndex: 'isUnique',
      key: 'isUnique',
      width: 80,
      render: (value: boolean, record: TableColumn, index: number) => (
        <Switch
          checked={value}
          onChange={(checked) => updateColumn(index, 'isUnique', checked)}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: TableColumn, index: number) => (
        <Input
          placeholder="Column description"
          value={text}
          onChange={(e) => updateColumn(index, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: TableColumn, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeColumn(index)}
          disabled={record.name === 'raw_payload' || record.name === 'ingested_at'}
        />
      ),
    },
  ];

  return (
    <Card title={<Title level={4}><DatabaseOutlined /> Step 4: Choose Destination</Title>} bordered={false}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          includeRawPayload: true,
          includeIngestedAt: true
        }}
      >
        <Alert
          message="Database Destination Configuration"
          description="Configure where and how the extracted data will be stored in your database."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          name="tableName"
          label="Table Name"
          rules={[
            { required: true, message: 'Please enter a table name' },
            { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: 'Invalid table name format' }
          ]}
        >
          <Input
            placeholder="e.g., api_users, product_data"
            value={tableName}
            onChange={handleTableNameChange}
            prefix={<DatabaseOutlined />}
          />
        </Form.Item>

        <Divider orientation="left">System Columns</Divider>

        <Form.Item label="Include System Columns">
          <Space direction="vertical">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                <Switch
                  checked={includeRawPayload}
                  onChange={setIncludeRawPayload}
                />
                <Text strong>raw_payload (JSONB)</Text>
                <Tooltip title="Store the complete raw JSON response from the API">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
              <Text type="secondary">Always included for debugging and audit purposes</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                <Switch
                  checked={includeIngestedAt}
                  onChange={setIncludeIngestedAt}
                />
                <Text strong>ingested_at (TIMESTAMP)</Text>
                <Tooltip title="Timestamp when the data was ingested">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
              <Text type="secondary">Track when data was processed</Text>
            </div>
          </Space>
        </Form.Item>

        <Divider orientation="left">Table Schema</Divider>

        <Alert
          message="Column Configuration"
          description={
            extractData && extractData.extractionPaths 
              ? "Configure the columns for your table. Columns are automatically generated from your extraction configuration."
              : "Showing sample columns. Complete the Extract step first to auto-generate columns from your extraction configuration, or manually add columns below."
          }
          type={extractData && extractData.extractionPaths ? "info" : "warning"}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          dataSource={columns}
          columns={columnColumns}
          pagination={false}
          rowKey={(record, index) => (index ?? 0).toString()}
          style={{ marginBottom: 16 }}
        />

        <Space style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            onClick={addColumn}
            icon={<PlusOutlined />}
          >
            Add Column
          </Button>
          {extractData && extractData.extractionPaths && (
            <Button
              onClick={initializeColumnsFromExtractData}
              icon={<DatabaseOutlined />}
            >
              Refresh from Extract Data
            </Button>
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
            <Button 
              type="primary" 
              htmlType="submit"
            >
              Next Step
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default DestinationStep;
