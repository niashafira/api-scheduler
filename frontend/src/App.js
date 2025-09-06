import { Button, Layout, Typography, Space, Card } from 'antd';
import { GithubOutlined, ApiOutlined, ScheduleOutlined } from '@ant-design/icons';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo" />
        <Title level={4} style={{ color: 'white', margin: 0 }}>
          <Space>
            <ScheduleOutlined />
            API Call Scheduler
          </Space>
        </Title>
      </Header>
      <Content style={{ padding: '50px', minHeight: 'calc(100vh - 64px - 70px)' }}>
        <div className="site-layout-content">
          <Card title="Welcome to API Call Scheduler" style={{ width: '100%' }}>
            <Typography>
              <Title level={3}>Getting Started</Title>
              <Text>This application helps you schedule and manage API calls efficiently.</Text>
              
              <div style={{ marginTop: '20px' }}>
                <Space>
                  <Button type="primary" icon={<ApiOutlined />}>
                    View API Endpoints
                  </Button>
                  <Button icon={<ScheduleOutlined />}>
                    Schedule New Call
                  </Button>
                </Space>
              </div>
            </Typography>
          </Card>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        API Call Scheduler ©{new Date().getFullYear()} Created with Ant Design
        <div>
          <GithubOutlined style={{ fontSize: '16px', margin: '0 8px' }} />
        </div>
      </Footer>
    </Layout>
  );
}

export default App;
