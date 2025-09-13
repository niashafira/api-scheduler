import React, { useState } from 'react';
import { Steps, Button, Card, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SourceStep from './SourceStep';
import RequestStep from './RequestStep';
import ExtractStep from './ExtractStep';
import DestinationStep from './DestinationStep';
import ScheduleStep from './ScheduleStep';
import ReviewStep from './ReviewStep';
import { ApiSource, ApiRequest, ApiExtract } from '../../types';

const { Step } = Steps;
const { Title } = Typography;

interface WizardData {
  source: ApiSource | null;
  request: ApiRequest | null;
  extract: ApiExtract | null;
  destination: any;
  schedule: any;
  review: any;
}

const WizardContainer: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    source: null,
    request: null,
    extract: null,
    destination: {},
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
      content: <RequestStep 
        onNext={(data) => {
          setWizardData({...wizardData, request: data});
          setCurrentStep(currentStep + 1);
        }}
        onPrevious={() => setCurrentStep(currentStep - 1)}
        sourceData={wizardData.source}
      />
    },
    {
      title: 'Extract',
      description: 'Extract Data',
      content: <ExtractStep 
        onNext={(data) => {
          setWizardData({...wizardData, extract: data});
          setCurrentStep(currentStep + 1);
        }}
        onPrevious={() => setCurrentStep(currentStep - 1)}
        sourceData={wizardData.source}
        requestData={wizardData.request}
      />
    },
    {
      title: 'Destination',
      description: 'Choose Destination',
      content: <DestinationStep 
        onNext={(data) => {
          setWizardData({...wizardData, destination: data});
          setCurrentStep(currentStep + 1);
        }}
        onPrevious={() => setCurrentStep(currentStep - 1)}
        sourceData={wizardData.source}
        requestData={wizardData.request}
        extractData={wizardData.extract}
      />
    },
    {
      title: 'Schedule',
      description: 'Set Schedule',
      content: <ScheduleStep 
        onNext={(data) => {
          setWizardData({...wizardData, schedule: data});
          setCurrentStep(currentStep + 1);
        }}
        onPrevious={() => setCurrentStep(currentStep - 1)}
        sourceData={wizardData.source}
        requestData={wizardData.request}
        extractData={wizardData.extract}
        destinationData={wizardData.destination}
      />
    },
    {
      title: 'Review',
      description: 'Review & Test',
      content: <ReviewStep 
        onPrevious={() => setCurrentStep(currentStep - 1)}
        onFinish={() => {
          message.success('API Call Scheduler configuration created successfully!');
          navigate('/sources');
        }}
        sourceData={wizardData.source}
        requestData={wizardData.request}
        extractData={wizardData.extract}
        destinationData={wizardData.destination}
        scheduleData={wizardData.schedule}
      />
    }
  ];

  const handleBack = (): void => {
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
