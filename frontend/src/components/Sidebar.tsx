import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Link } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Sider } = Layout;

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      path: '/profile'
    }
  ];

  return (
    <Sider
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0
      }}
    >
      <div className="logo" style={{ 
        padding: '16px', 
        textAlign: 'left', 
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <img 
          src="/logo.png" 
          alt="DocuVault" 
          style={{ 
            width: 'auto', 
            height: '32px',
            maxWidth: '150px',
            objectFit: 'contain'
          }} 
        />
        <Title level={3} style={{ 
          margin: 0,
          color: '#fff',
          fontWeight: 600
        }}>DocuVault</Title>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        style={{ borderRight: 0 }}
        items={menuItems.map(item => ({
          key: item.key,
          icon: item.icon,
          label: <Link to={item.path}>{item.label}</Link>
        }))}
      />
    </Sider>
  );
};