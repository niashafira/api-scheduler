import React, { useState } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import { 
  ApiOutlined, 
  ScheduleOutlined, 
  DashboardOutlined, 
  HistoryOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { Link, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/sources',
      icon: <ApiOutlined />,
      label: <Link to="/sources">API Sources</Link>,
    },
    {
      key: '/token-configs',
      icon: <KeyOutlined />,
      label: <Link to="/token-configs">Token Configs</Link>,
    },
    {
      key: '/schedules',
      icon: <ScheduleOutlined />,
      label: <Link to="/schedules">Schedules</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">Run History</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '16px 0' : '16px 24px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <ScheduleOutlined style={{ fontSize: '24px', marginRight: collapsed ? 0 : 12 }} />
          {!collapsed && <Title level={5} style={{ margin: 0 }}>API Scheduler</Title>}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: '18px' }
          })}
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          minHeight: 280 
        }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          API Call Scheduler ©{new Date().getFullYear()} Created with Ant Design
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
