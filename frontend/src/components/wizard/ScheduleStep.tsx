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
  Radio,
  InputNumber,
  Select,
  Switch,
  message,
  Tooltip,
  Collapse
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { ApiSource, ApiRequest, ApiExtract } from '../../types';
// Using native Date handling instead of dayjs

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

interface ScheduleStepProps {
  onNext?: (data: any) => void;
  onPrevious?: () => void;
  sourceData?: ApiSource | null;
  requestData?: ApiRequest | null;
  extractData?: ApiExtract | null;
  destinationData?: any;
  initialData?: any;
  isEditMode?: boolean;
}

interface ScheduleConfig {
  scheduleType: 'manual' | 'interval' | 'cron' | 'once';
  enabled: boolean;
  interval?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  cron?: {
    expression: string;
    description: string;
  };
  timezone: string;
  maxRetries: number;
  retryDelay: number;
  retryDelayUnit: 'seconds' | 'minutes' | 'hours';
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({ 
  onNext, 
  onPrevious, 
  sourceData, 
  requestData, 
  extractData, 
  destinationData,
  initialData = null, 
  isEditMode = false 
}) => {
  const [form] = Form.useForm();
  const [scheduleType, setScheduleType] = useState<'manual' | 'interval' | 'cron' | 'once'>('manual');
  const [enabled, setEnabled] = useState<boolean>(true);
  const [customCron, setCustomCron] = useState<boolean>(false);

  // Predefined cron expressions
  const cronPresets = [
    { expression: '0 */5 * * * *', description: 'Every 5 minutes' },
    { expression: '0 */15 * * * *', description: 'Every 15 minutes' },
    { expression: '0 */30 * * * *', description: 'Every 30 minutes' },
    { expression: '0 0 * * * *', description: 'Every hour' },
    { expression: '0 0 */2 * * *', description: 'Every 2 hours' },
    { expression: '0 0 */6 * * *', description: 'Every 6 hours' },
    { expression: '0 0 */12 * * *', description: 'Every 12 hours' },
    { expression: '0 0 0 * * *', description: 'Daily at midnight' },
    { expression: '0 0 9 * * *', description: 'Daily at 9:00 AM' },
    { expression: '0 0 0 * * 1', description: 'Weekly on Monday' },
    { expression: '0 0 0 1 * *', description: 'Monthly on the 1st' }
  ];

  // Timezone options
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  // Initialize form when component mounts
  useEffect(() => {
    if (isEditMode && initialData) {
      populateFormWithInitialData();
    } else {
      initializeDefaultValues();
    }
  }, [isEditMode, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const populateFormWithInitialData = (): void => {
    if (!initialData) return;

    form.setFieldsValue({
      scheduleType: initialData.scheduleType || 'manual',
      enabled: initialData.enabled !== false,
      intervalValue: initialData.interval?.value || 1,
      intervalUnit: initialData.interval?.unit || 'hours',
      cronExpression: initialData.cron?.expression || '',
      timezone: initialData.timezone || 'UTC',
      maxRetries: initialData.maxRetries || 3,
      retryDelay: initialData.retryDelay || 5,
      retryDelayUnit: initialData.retryDelayUnit || 'minutes'
    });

    setScheduleType(initialData.scheduleType || 'manual');
    setEnabled(initialData.enabled !== false);
    setCustomCron(initialData.cron?.expression && !cronPresets.some(preset => preset.expression === initialData.cron.expression));
  };

  const initializeDefaultValues = (): void => {
    form.setFieldsValue({
      scheduleType: 'manual',
      enabled: true,
      intervalValue: 1,
      intervalUnit: 'hours',
      cronExpression: '0 */30 * * * *',
      timezone: 'UTC',
      maxRetries: 3,
      retryDelay: 5,
      retryDelayUnit: 'minutes'
    });
  };

  const handleScheduleTypeChange = (e: any): void => {
    const value = e.target.value;
    setScheduleType(value);
    
    // Reset form values when changing schedule type
    if (value === 'manual') {
      form.setFieldsValue({
        intervalValue: 1,
        intervalUnit: 'hours',
        cronExpression: '0 */30 * * * *'
      });
    }
  };

  const handleCronPresetChange = (value: string): void => {
    const preset = cronPresets.find(p => p.expression === value);
    if (preset) {
      form.setFieldsValue({
        cronExpression: preset.expression
      });
      setCustomCron(false);
    }
  };

  const handleCustomCronToggle = (): void => {
    setCustomCron(!customCron);
    if (!customCron) {
      form.setFieldsValue({
        cronExpression: ''
      });
    } else {
      form.setFieldsValue({
        cronExpression: '0 */30 * * * *'
      });
    }
  };

  const validateCronExpression = (expression: string): boolean => {
    // Basic cron validation (6 fields: second minute hour day month weekday)
    const cronRegex = /^(\*|([0-5]?\d)) (\*|([0-5]?\d)) (\*|(2[0-3]|[01]?\d)) (\*|(3[01]|[12]\d|0?[1-9])) (\*|(1[0-2]|0?[1-9])) (\*|([0-6]))$/;
    return cronRegex.test(expression);
  };

  const handleSubmit = async (values: any): Promise<void> => {
    try {
      // Validate cron expression if using cron schedule
      if (scheduleType === 'cron' && values.cronExpression) {
        if (!validateCronExpression(values.cronExpression)) {
          message.error('Invalid cron expression format');
          return;
        }
      }

      const formData: ScheduleConfig = {
        scheduleType: scheduleType,
        enabled: enabled,
        timezone: values.timezone || 'UTC',
        maxRetries: values.maxRetries || 3,
        retryDelay: values.retryDelay || 5,
        retryDelayUnit: values.retryDelayUnit || 'minutes'
      };

      // Add schedule-specific configuration
      if (scheduleType === 'interval') {
        formData.interval = {
          value: values.intervalValue || 1,
          unit: values.intervalUnit || 'hours'
        };
      } else if (scheduleType === 'cron') {
        formData.cron = {
          expression: values.cronExpression || '0 */30 * * * *',
          description: cronPresets.find(p => p.expression === values.cronExpression)?.description || 'Custom schedule'
        };
      }


      console.log('Schedule configuration to save:', formData);
      message.success('Schedule configuration saved successfully!');

      // Move to next step
      if (onNext) {
        onNext(formData);
      }
    } catch (error) {
      console.error('Failed to save schedule configuration:', error);
      message.error('Failed to save schedule configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getScheduleDescription = (): string => {
    switch (scheduleType) {
      case 'manual':
        return 'Execute manually when needed';
      case 'interval':
        const intervalValue = form.getFieldValue('intervalValue') || 1;
        const intervalUnit = form.getFieldValue('intervalUnit') || 'hours';
        return `Execute every ${intervalValue} ${intervalUnit}`;
      case 'cron':
        const cronExpression = form.getFieldValue('cronExpression') || '0 */30 * * * *';
        const preset = cronPresets.find(p => p.expression === cronExpression);
        return preset ? preset.description : `Custom cron: ${cronExpression}`;
      case 'once':
        return 'Execute once at a specific time';
      default:
        return 'No schedule configured';
    }
  };

  return (
    <Card title={<Title level={4}><ClockCircleOutlined /> Step 5: Set Schedule</Title>} bordered={false}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          scheduleType: 'manual',
          enabled: true,
          intervalValue: 1,
          intervalUnit: 'hours',
          cronExpression: '0 */30 * * * *',
          timezone: 'UTC',
          maxRetries: 3,
          retryDelay: 5,
          retryDelayUnit: 'minutes'
        }}
      >
        <Alert
          message="Schedule Configuration"
          description="Configure when and how often the API should be called to extract data."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          name="enabled"
          label="Enable Scheduling"
          valuePropName="checked"
        >
          <Switch
            checked={enabled}
            onChange={setEnabled}
            checkedChildren={<PlayCircleOutlined />}
            unCheckedChildren={<PauseCircleOutlined />}
          />
        </Form.Item>

        {enabled && (
          <>
            <Form.Item
              name="scheduleType"
              label="Schedule Type"
              rules={[{ required: true, message: 'Please select a schedule type' }]}
            >
              <Radio.Group onChange={handleScheduleTypeChange} value={scheduleType}>
                <Space direction="vertical">
                  <Radio value="manual">
                    <Space direction="vertical" size={0}>
                      <Text strong>Manual Execution</Text>
                      <Text type="secondary">Run manually when needed</Text>
                    </Space>
                  </Radio>
                  <Radio value="interval">
                    <Space direction="vertical" size={0}>
                      <Text strong>Interval-based</Text>
                      <Text type="secondary">Run at regular intervals</Text>
                    </Space>
                  </Radio>
                  <Radio value="cron">
                    <Space direction="vertical" size={0}>
                      <Text strong>Cron Expression</Text>
                      <Text type="secondary">Advanced scheduling with cron syntax</Text>
                    </Space>
                  </Radio>
                  <Radio value="once">
                    <Space direction="vertical" size={0}>
                      <Text strong>One-time Execution</Text>
                      <Text type="secondary">Run once at a specific time</Text>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {scheduleType === 'interval' && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                  <Form.Item
                    name="intervalValue"
                    label="Interval"
                    rules={[{ required: true, message: 'Please enter interval value' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={1} max={999} />
                  </Form.Item>
                  <Form.Item
                    name="intervalUnit"
                    label="Unit"
                    rules={[{ required: true, message: 'Please select interval unit' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select style={{ width: 120 }}>
                      <Option value="minutes">Minutes</Option>
                      <Option value="hours">Hours</Option>
                      <Option value="days">Days</Option>
                      <Option value="weeks">Weeks</Option>
                    </Select>
                  </Form.Item>
                </Space>
              </Card>
            )}

            {scheduleType === 'cron' && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Preset Schedules</Text>
                    <Form.Item
                      name="cronPreset"
                      style={{ marginBottom: 8 }}
                    >
                      <Select
                        placeholder="Select a preset schedule"
                        onChange={handleCronPresetChange}
                        disabled={customCron}
                      >
                        {cronPresets.map(preset => (
                          <Option key={preset.expression} value={preset.expression}>
                            {preset.description}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Button
                      type="link"
                      size="small"
                      onClick={handleCustomCronToggle}
                    >
                      {customCron ? 'Use Preset' : 'Custom Expression'}
                    </Button>
                  </div>
                  <Form.Item
                    name="cronExpression"
                    label="Cron Expression"
                    rules={[
                      { required: true, message: 'Please enter cron expression' },
                      { 
                        validator: (_, value) => {
                          if (value && !validateCronExpression(value)) {
                            return Promise.reject(new Error('Invalid cron expression format'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input
                      placeholder="0 */30 * * * *"
                      disabled={!customCron}
                      suffix={
                        <Tooltip title="Format: second minute hour day month weekday">
                          <InfoCircleOutlined />
                        </Tooltip>
                      }
                    />
                  </Form.Item>
                </Space>
              </Card>
            )}

            <Divider orientation="left">Advanced Settings</Divider>

            <Form.Item
              name="timezone"
              label="Timezone"
              rules={[{ required: true, message: 'Please select timezone' }]}
            >
              <Select>
                {timezones.map(tz => (
                  <Option key={tz} value={tz}>{tz}</Option>
                ))}
              </Select>
            </Form.Item>

            <Collapse size="small">
              <Panel header="Error Handling" key="errorHandling">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    name="maxRetries"
                    label="Max Retries"
                    rules={[{ required: true, message: 'Please enter max retries' }]}
                  >
                    <InputNumber min={0} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                  <Space>
                    <Form.Item
                      name="retryDelay"
                      label="Retry Delay"
                      rules={[{ required: true, message: 'Please enter retry delay' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={1} max={3600} />
                    </Form.Item>
                    <Form.Item
                      name="retryDelayUnit"
                      label="Unit"
                      rules={[{ required: true, message: 'Please select retry delay unit' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select style={{ width: 100 }}>
                        <Option value="seconds">Seconds</Option>
                        <Option value="minutes">Minutes</Option>
                        <Option value="hours">Hours</Option>
                      </Select>
                    </Form.Item>
                  </Space>
                </Space>
              </Panel>
            </Collapse>

            <Alert
              message="Schedule Summary"
              description={getScheduleDescription()}
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </>
        )}

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

export default ScheduleStep;
