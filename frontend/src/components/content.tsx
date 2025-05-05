import React from 'react';
import { Layout, Card } from 'antd';
import { Link } from 'react-router-dom';

const { Content: LayoutContent } = Layout;

export const Content = () => {
  return (
    <LayoutContent style={{ padding: '24px' }}>
      <Card>
        <h2>Welcome to DocuVault</h2>
        <p>Please select a section from the navigation above.</p>
      </Card>
    </LayoutContent>
  );
};