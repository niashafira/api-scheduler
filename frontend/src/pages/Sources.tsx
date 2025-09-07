import React from 'react';
import { Card } from 'antd';
import SourcesTable from '../components/sources/SourcesTable';

const Sources: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <SourcesTable />
      </Card>
    </div>
  );
};

export default Sources;
