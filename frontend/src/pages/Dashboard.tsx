import React from 'react';
import { Row, Col, Card, Statistic, Typography, Space } from 'antd';
import { ApiOutlined, ScheduleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="API Sources" 
              value={5} 
              prefix={<ApiOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Active Schedules" 
              value={8} 
              prefix={<ScheduleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Successful Runs" 
              value={142} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Pending Runs" 
              value={3} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
