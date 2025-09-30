import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          margin: '0 0 16px 0',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          RecurFlow Pro ⚙️
        </h1>
        <p style={{ 
          margin: '0',
          color: '#666',
          fontSize: '16px'
        }}>
          Recurring tasks and time tracking for monday.com
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        {/* Recurring Tasks Widget */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e1e4e8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333'
          }}>
            📅 Recurring Tasks
          </h2>
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', color: '#666' }}>
              No recurring tasks configured yet
            </p>
            <button style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#0073ea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Create Recurring Task
            </button>
          </div>
        </div>

        {/* Time Tracker Widget */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e1e4e8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333'
          }}>
            ⏱️ Time Tracker
          </h2>
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: '#333',
              marginBottom: '12px'
            }}>
              00:00:00
            </div>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#00c875',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              ▶️ Start Timer
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e1e4e8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333'
          }}>
            📊 Quick Stats
          </h2>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Active Tasks
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                0
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Hours Today
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00c875' }}>
                0.0
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #e1e4e8',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h2 style={{ 
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#333'
        }}>
          📋 Recent Activity
        </h2>
        <div style={{
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0', color: '#666' }}>
            No recent activity to display
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;