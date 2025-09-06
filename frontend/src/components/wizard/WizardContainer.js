import React, { useState } from 'react';
import { Steps, Button, Card, Space, Typography } from 'antd';
import { ArrowLeftOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SourceStep from './SourceStep';

const { Step } = Steps;
const { Title } = Typography;

const WizardContainer = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    source: {},
    request: {},
    extract: {},
    schema: {},
    destination: {},
    loadStrategy: {},
    pagination: {},
    schedule: {},
    review: {}
  });

  const steps = [
    {
      title: 'Source',
      description: 'API Source',
      content: <SourceStep 
        onNext={(data) => {
          setWizardData({...wizardData, source: data});
          setCurrentStep(currentStep + 1);
        }}
      />
    },
    {
      title: 'Request',
      description: 'Define Request',
      content: <div>Request Step (Coming Soon)</div>
    },
    {
      title: 'Extract',
      description: 'Extract Data',
      content: <div>Extract Step (Coming Soon)</div>
    },
    {
      title: 'Schema',
      description: 'Schema & Mapping',
      content: <div>Schema & Mapping Step (Coming Soon)</div>
    },
    {
      title: 'Destination',
      description: 'Choose Destination',
      content: <div>Destination Step (Coming Soon)</div>
    },
    {
      title: 'Load Strategy',
      description: 'Load Strategy & State',
      content: <div>Load Strategy Step (Coming Soon)</div>
    },
    {
      title: 'Pagination',
      description: 'Pagination & Limits',
      content: <div>Pagination Step (Coming Soon)</div>
    },
    {
      title: 'Schedule',
      description: 'Set Schedule',
      content: <div>Schedule Step (Coming Soon)</div>
    },
    {
      title: 'Review',
      description: 'Review & Test',
      content: <div>Review & Test Step (Coming Soon)</div>
    },
    {
      title: 'Enable',
      description: 'Enable & Monitor',
      content: <div>Enable & Monitor Step (Coming Soon)</div>
    }
  ];

  const handleBack = () => {
    if (currentStep === 0) {
      navigate('/sources');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              style={{ marginRight: '10px' }}
            />
            <Title level={4} style={{ margin: 0 }}>
              <ApiOutlined /> Create API Source
            </Title>
          </Space>
        }
        style={{ marginBottom: '20px' }}
      >
        <Steps current={currentStep} size="small" style={{ marginBottom: '40px' }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} description={item.description} />
          ))}
        </Steps>
        <div className="steps-content">
          {steps[currentStep].content}
        </div>
      </Card>
    </div>
  );
};

export default WizardContainer;
