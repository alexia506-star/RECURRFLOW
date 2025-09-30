import React from 'react';
import { DashboardWidget, TimerWidget, TimeEntryList } from '../components';

const App: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <DashboardWidget />
      
      <div style={{ marginTop: '20px' }}>
        <TimerWidget 
          mondayUserId="demo_user_123"
          mondayItemId="demo_item_456"
        />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <TimeEntryList 
          mondayAccountId="demo_account"
          mondayUserId="demo_user_123"
        />
      </div>
    </div>
  );
};

export default App;