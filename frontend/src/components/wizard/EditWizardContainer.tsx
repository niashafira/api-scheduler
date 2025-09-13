import React, { useState, useEffect } from 'react';
import { Steps, Button, Card, Space, Typography, Spin, Alert, message } from 'antd';
import { ArrowLeftOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import SourceStep from './SourceStep';
import RequestStep from './RequestStep';
import ExtractStep from './ExtractStep';
import DestinationStep from './DestinationStep';
import ScheduleStep from './ScheduleStep';
import ReviewStep from './ReviewStep';
import apiSourceApi from '../../services/apiSourceApi';
import apiRequestApi from '../../services/apiRequestApi';
import apiExtractApi from '../../services/apiExtractApi';
import destinationApi from '../../services/destinationApi';
import scheduleApi from '../../services/scheduleApi';
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

const EditWizardContainer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [wizardData, setWizardData] = useState<WizardData>({
    source: null,
    request: null,
    extract: null,
    destination: {},
    schedule: {},
    review: {}
  });

  // Determine which step to resume from based on existing data
  const determineResumeStep = (sourceData: ApiSource | null, requestData: ApiRequest | null, extractData: ApiExtract | null, destinationData: any, scheduleData: any): number => {
    if (!sourceData || !sourceData.id) return 0; // Start from source step
    if (!requestData || !requestData.id) return 1; // Resume from request step
    if (!extractData || !extractData.id) return 2; // Resume from extract step
    if (!destinationData || !destinationData.id) return 3; // Resume from destination step
    if (!scheduleData || !scheduleData.id) return 4; // Resume from schedule step
    return 5; // Resume from review step (all data exists)
  };

  // Load existing data for the source
  useEffect(() => {
    loadExistingData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExistingData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Load source data
      const sourceResponse = await apiSourceApi.getApiSource(Number(id));
      if (!sourceResponse.success) {
        throw new Error('Source not found');
      }
      
      const sourceData = sourceResponse.data;
      console.log('EditWizardContainer - Loaded sourceData:', sourceData);
      setWizardData(prev => ({ ...prev, source: sourceData || null }));
      
      // Load associated requests
      const requestsResponse = await apiRequestApi.getApiRequestsBySource(Number(id));
      const requests = requestsResponse.success ? requestsResponse.data || [] : [];
      let extracts: ApiExtract[] = [];
      let destinationData: any = null;
      let scheduleData: any = null;
      
      if (requests.length > 0) {
        // Use the first request for now (could be enhanced to let user choose)
        const requestData = requests[0];
        console.log('EditWizardContainer - Loaded requestData:', requestData);
        setWizardData(prev => ({ ...prev, request: requestData || null }));
        
        // Load associated extracts
        const extractsResponse = await apiExtractApi.getApiExtractsByRequest(requestData.id);
        extracts = extractsResponse.success ? extractsResponse.data || [] : [];
        
        if (extracts.length > 0) {
          const extractData = extracts[0];
          setWizardData(prev => ({ ...prev, extract: extractData || null }));
          
          // Load associated destinations
          const destinationsResponse = await destinationApi.getDestinationsBySource(Number(id));
          const destinations = destinationsResponse.success ? destinationsResponse.data || [] : [];
          
          if (destinations.length > 0) {
            destinationData = destinations[0];
            setWizardData(prev => ({ ...prev, destination: destinationData || null }));
            
            // Load associated schedules
            const schedulesResponse = await scheduleApi.getSchedulesBySource(Number(id));
            const schedules = schedulesResponse.success ? schedulesResponse.data || [] : [];
            
            if (schedules.length > 0) {
              scheduleData = schedules[0];
              setWizardData(prev => ({ ...prev, schedule: scheduleData || null }));
            }
          }
        }
      }
      
      // Determine which step to resume from
      const resumeStep = determineResumeStep(sourceData || null, requests[0] || null, extracts[0] || null, destinationData, scheduleData);
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
        initialData={wizardData.destination}
        isEditMode={true}
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
        initialData={wizardData.schedule}
        isEditMode={true}
      />
    },
    {
      title: 'Review',
      description: 'Review & Test',
      content: <ReviewStep 
        onPrevious={() => setCurrentStep(currentStep - 1)}
        onFinish={() => {
          message.success('API Call Scheduler configuration updated successfully!');
          navigate('/sources');
        }}
        sourceData={wizardData.source}
        requestData={wizardData.request}
        extractData={wizardData.extract}
        destinationData={wizardData.destination}
        scheduleData={wizardData.schedule}
        isEditMode={true}
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
