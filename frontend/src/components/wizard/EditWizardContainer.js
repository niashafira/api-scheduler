import React, { useState, useEffect } from 'react';
import { Steps, Button, Card, Space, Typography, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import SourceStep from './SourceStep';
import RequestStep from './RequestStep';
import ExtractStep from './ExtractStep';
import apiSourceApi from '../../services/apiSourceApi';
import apiRequestApi from '../../services/apiRequestApi';
import apiExtractApi from '../../services/apiExtractApi';

const { Step } = Steps;
const { Title } = Typography;

const EditWizardContainer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
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

  // Determine which step to resume from based on existing data
  const determineResumeStep = (sourceData, requestData, extractData) => {
    if (!sourceData || !sourceData.id) return 0; // Start from source step
    if (!requestData || !requestData.id) return 1; // Resume from request step
    if (!extractData || !extractData.id) return 2; // Resume from extract step
    return 3; // Resume from schema step
  };

  // Load existing data for the source
  useEffect(() => {
    loadExistingData();
  }, [id]);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      
      // Load source data
      const sourceResponse = await apiSourceApi.getApiSource(id);
      if (!sourceResponse.success) {
        throw new Error('Source not found');
      }
      
      const sourceData = sourceResponse.data;
      console.log('EditWizardContainer - Loaded sourceData:', sourceData);
      setWizardData(prev => ({ ...prev, source: sourceData }));
      
      // Load associated requests
      const requestsResponse = await apiRequestApi.getApiRequestsBySource(id);
      const requests = requestsResponse.success ? requestsResponse.data : [];
      let extracts = [];
      
      if (requests.length > 0) {
        // Use the first request for now (could be enhanced to let user choose)
        const requestData = requests[0];
        console.log('EditWizardContainer - Loaded requestData:', requestData);
        setWizardData(prev => ({ ...prev, request: requestData }));
        
        // Load associated extracts
        const extractsResponse = await apiExtractApi.getApiExtractsByRequest(requestData.id);
        extracts = extractsResponse.success ? extractsResponse.data : [];
        
        if (extracts.length > 0) {
          const extractData = extracts[0];
          setWizardData(prev => ({ ...prev, extract: extractData }));
        }
      }
      
      // Determine which step to resume from
      const resumeStep = determineResumeStep(sourceData, requests[0], extracts[0]);
      setCurrentStep(resumeStep);
      
    } catch (error) {
      console.error('Failed to load existing data:', error);
      // Handle error - maybe redirect back to sources list
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Source',
      description: 'API Source',
      content: <SourceStep 
        onNext={(data) => {
          setWizardData({...wizardData, source: data});
          setCurrentStep(currentStep + 1);
        }}
        initialData={wizardData.source}
        isEditMode={true}
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
        initialData={wizardData.request}
        isEditMode={true}
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
        initialData={wizardData.extract}
        isEditMode={true}
      />
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

  const handleFinish = () => {
    // Handle completion of the wizard
    navigate('/sources');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading configuration...</div>
      </div>
    );
  }

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
              <ApiOutlined /> Edit API Configuration
            </Title>
          </Space>
        }
        style={{ marginBottom: '20px' }}
      >
        <Alert
          message="Resuming Configuration"
          description={`You are editing an existing API source. You can continue from where you left off or modify any previous steps.`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
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

export default EditWizardContainer;
