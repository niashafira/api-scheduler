import React from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Descriptions,
  Tag,
  Row,
  Col,
  Statistic,
  Collapse
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SettingOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { ApiSource, ApiRequest, ApiExtract } from '../../types';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface ReviewStepProps {
  onFinish?: () => void;
  sourceData?: ApiSource | null;
  requestData?: ApiRequest | null;
  extractData?: ApiExtract | null;
  destinationData?: any;
  scheduleData?: any;
  isEditMode?: boolean;
}


const ReviewStep: React.FC<ReviewStepProps> = ({
  onFinish,
  sourceData,
  requestData,
  extractData,
  destinationData,
  scheduleData,
  isEditMode = false
}) => {


  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'paused': return 'orange';
      default: return 'blue';
    }
  };

  const getScheduleTypeIcon = (type: string) => {
    switch (type) {
      case 'manual': return <PlayCircleOutlined />;
      case 'cron': return <ClockCircleOutlined />;
      default: return <SettingOutlined />;
    }
  };

  const getScheduleDescription = (schedule: any): string => {
    if (!schedule) return 'No schedule configured';
    
    if (schedule.scheduleType === 'manual') {
      return 'Manual execution';
    } else if (schedule.scheduleType === 'cron') {
      return schedule.cronDescription || `Cron: ${schedule.cronExpression}`;
    }
    
    return 'Unknown schedule type';
  };


  return (
    <Card title={<Title level={4}><CheckCircleOutlined /> Step 6: Review Configuration</Title>} bordered={false}>
      <Alert
        message="Configuration Review"
        description="Review your API call scheduler configuration to ensure everything is set up correctly."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {/* Configuration Summary */}
        <Col span={24}>
          <Card title="Configuration Summary" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="API Source"
                  value={sourceData ? 1 : 0}
                  suffix="/ 1"
                  prefix={<ApiOutlined />}
                  valueStyle={{ color: sourceData ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="API Request"
                  value={requestData ? 1 : 0}
                  suffix="/ 1"
                  prefix={<SettingOutlined />}
                  valueStyle={{ color: requestData ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Data Extract"
                  value={extractData ? 1 : 0}
                  suffix="/ 1"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: extractData ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Destination"
                  value={destinationData ? 1 : 0}
                  suffix="/ 1"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: destinationData ? '#3f8600' : '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Detailed Configuration */}
        <Col span={24}>
          <Collapse defaultActiveKey={['source', 'request']}>
            {/* API Source Details */}
            <Panel header="API Source Configuration" key="source">
              {sourceData ? (
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Name">{sourceData.name}</Descriptions.Item>
                  <Descriptions.Item label="Base URL">{sourceData.baseUrl}</Descriptions.Item>
                  <Descriptions.Item label="Auth Type">{sourceData.authType}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(sourceData.status || 'active')}>
                      {sourceData.status || 'active'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert message="No API source configured" type="warning" />
              )}
            </Panel>

            {/* API Request Details */}
            <Panel header="API Request Configuration" key="request">
              {requestData ? (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Complete URL">
                    {sourceData?.baseUrl}{requestData.path}
                    {requestData.queryParams && requestData.queryParams.length > 0 && (
                      <span>
                        ?{requestData.queryParams
                          .filter(param => param.value)
                          .map(param => `${param.name}=${param.value}`)
                          .join('&')}
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Method">
                    <Tag color="blue">{requestData.method}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Headers">
                    {requestData.headers?.length || 0} header(s) configured
                  </Descriptions.Item>
                  <Descriptions.Item label="Body">
                    {requestData.body ? 'Yes' : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(requestData.status || 'active')}>
                      {requestData.status || 'active'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert message="No API request configured" type="warning" />
              )}
            </Panel>

            {/* Data Extract Details */}
            <Panel header="Data Extraction Configuration" key="extract">
              {extractData ? (
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Root Array Path">
                    {extractData.rootArrayPath || 'Not specified'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Extraction Paths">
                    {extractData.extractionPaths?.length || 0} path(s) configured
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(extractData.status || 'active')}>
                      {extractData.status || 'active'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert message="No data extraction configured" type="warning" />
              )}
            </Panel>

            {/* Destination Details */}
            <Panel header="Destination Configuration" key="destination">
              {destinationData ? (
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Table Name">{destinationData.tableName}</Descriptions.Item>
                  <Descriptions.Item label="Columns">
                    {destinationData.columns?.length || 0} column(s) configured
                  </Descriptions.Item>
                  <Descriptions.Item label="Include Raw Payload">
                    {destinationData.includeRawPayload ? 'Yes' : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Include Ingested At">
                    {destinationData.includeIngestedAt ? 'Yes' : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(destinationData.status || 'active')}>
                      {destinationData.status || 'active'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert message="No destination configured" type="warning" />
              )}
            </Panel>

            {/* Schedule Details */}
            <Panel header="Schedule Configuration" key="schedule">
              {scheduleData ? (
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Schedule Type">
                    <Space>
                      {getScheduleTypeIcon(scheduleData.scheduleType)}
                      <Text strong>{scheduleData.scheduleType}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Description">
                    {getScheduleDescription(scheduleData)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Enabled">
                    <Tag color={scheduleData.enabled ? 'green' : 'red'}>
                      {scheduleData.enabled ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Timezone">{scheduleData.timezone}</Descriptions.Item>
                  <Descriptions.Item label="Max Retries">{scheduleData.maxRetries}</Descriptions.Item>
                  <Descriptions.Item label="Retry Delay">
                    {scheduleData.retryDelay} {scheduleData.retryDelayUnit}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(scheduleData.status || 'active')}>
                      {scheduleData.status || 'active'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert message="No schedule configured" type="warning" />
              )}
            </Panel>
          </Collapse>
        </Col>


      </Row>

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Button 
          type="primary" 
          size="large"
          onClick={onFinish}
          icon={<CheckCircleOutlined />}
        >
          Confirm
        </Button>
      </div>
    </Card>
  );
};

export default ReviewStep;
