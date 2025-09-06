import React from 'react';
import { Typography, Form, Input, Button, Card, Switch, InputNumber, Select, Divider, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const Settings = () => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Settings saved:', values);
  };

  return (
    <div>
      <Title level={4}>Settings</Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            concurrentJobs: 3,
            defaultTimeout: 30,
            retryAttempts: 3,
            retryDelay: 5,
            notificationsEnabled: true,
            notificationEmail: 'admin@example.com',
            logLevel: 'info',
            timezone: 'UTC',
          }}
        >
          <Divider orientation="left">Job Execution</Divider>
          
          <Form.Item
            name="concurrentJobs"
            label="Maximum Concurrent Jobs"
            rules={[{ required: true, message: 'Please enter maximum concurrent jobs' }]}
          >
            <InputNumber min={1} max={10} />
          </Form.Item>
          
          <Form.Item
            name="defaultTimeout"
            label="Default Timeout (seconds)"
            rules={[{ required: true, message: 'Please enter default timeout' }]}
          >
            <InputNumber min={5} max={300} />
          </Form.Item>
          
          <Form.Item
            name="retryAttempts"
            label="Retry Attempts"
            rules={[{ required: true, message: 'Please enter retry attempts' }]}
          >
            <InputNumber min={0} max={10} />
          </Form.Item>
          
          <Form.Item
            name="retryDelay"
            label="Retry Delay (minutes)"
            rules={[{ required: true, message: 'Please enter retry delay' }]}
          >
            <InputNumber min={1} max={60} />
          </Form.Item>

          <Divider orientation="left">Notifications</Divider>
          
          <Form.Item
            name="notificationsEnabled"
            label="Enable Notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="notificationEmail"
            label="Notification Email"
            rules={[
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input />
          </Form.Item>

          <Divider orientation="left">System</Divider>
          
          <Form.Item
            name="logLevel"
            label="Log Level"
          >
            <Select>
              <Option value="debug">Debug</Option>
              <Option value="info">Info</Option>
              <Option value="warn">Warning</Option>
              <Option value="error">Error</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="timezone"
            label="Default Timezone"
          >
            <Select showSearch>
              <Option value="UTC">UTC</Option>
              <Option value="America/New_York">America/New_York</Option>
              <Option value="America/Los_Angeles">America/Los_Angeles</Option>
              <Option value="Europe/London">Europe/London</Option>
              <Option value="Europe/Paris">Europe/Paris</Option>
              <Option value="Asia/Tokyo">Asia/Tokyo</Option>
              <Option value="Asia/Singapore">Asia/Singapore</Option>
              <Option value="Australia/Sydney">Australia/Sydney</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
