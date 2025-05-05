import React from 'react';
import { Layout, Typography, Button } from 'antd';
import { UserOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

const { Title } = Typography;

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Layout.Header style={{ padding: '0 24px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative', minHeight: 64 }}>
        {/* Left: App Name */}
        <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
          {/* Removed logo image from header to avoid duplicate logos */}
        </div>
        {/* Center: Greeting */}
        <div style={{ position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          {user && (
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 20, fontWeight: 600, color: '#222', pointerEvents: 'auto' }}>
              <UserOutlined style={{ marginRight: 8, fontSize: 24 }} />
              Welcome {user.name}
            </span>
          )}
        </div>
        {/* Right: Logout button */}
        <div style={{ marginLeft: 'auto', flex: '0 0 auto' }}>
          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <Button
              type="text"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => {
                onLogout();
              }}
            >
              <LogoutOutlined />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </div>
    </Layout.Header>
  );
};