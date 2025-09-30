import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Flex, 
  Text, 
  Loader, 
  Modal, 
  ModalContent,
  ModalHeader,
  ModalFooter,
  Toast
} from 'monday-ui-react-core';
import { Add, Settings } from 'monday-ui-react-core/icons';
import { RecurringTaskModal } from './RecurringTaskModal';
import { format } from 'date-fns';

interface RecurringTask {
  id: string;
  name: string;
  boardId: string;
  recurrenceType: string;
  nextOccurrence: string;
  status: string;
  createdAt: string;
}

export const DashboardWidget: React.FC = () => {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecurringTasks();
  }, []);

  const fetchRecurringTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recurring-tasks?mondayAccountId=demo_account');
      if (!response.ok) {
        throw new Error('Failed to fetch recurring tasks');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    fetchRecurringTasks();
    Toast.show({
      message: 'Recurring task created successfully!',
      type: 'positive'
    });
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(task => {
        const nextOccurrence = new Date(task.nextOccurrence);
        return nextOccurrence >= now && nextOccurrence <= nextWeek && task.status === 'active';
      })
      .sort((a, b) => new Date(a.nextOccurrence).getTime() - new Date(b.nextOccurrence).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ padding: '40px' }}>
        <Loader size="medium" />
        <Text type="text2" style={{ marginTop: '16px' }}>Loading recurring tasks...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ padding: '40px' }}>
        <Text type="text1" color="negative">{error}</Text>
        <Button 
          onClick={fetchRecurringTasks} 
          style={{ marginTop: '16px' }}
          size="small"
        >
          Retry
        </Button>
      </Flex>
    );
  }

  const upcomingTasks = getUpcomingTasks();

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: '20px' }}>
        <Text type="h3" weight="bold">RecurFlow Pro ⚙️</Text>
        <Button
          leftIcon={Settings}
          kind="tertiary"
          size="small"
        >
          Settings
        </Button>
      </Flex>

      <div style={{ marginBottom: '24px' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
          <Text type="text1" weight="medium">Upcoming Recurring Tasks</Text>
          <Button
            leftIcon={Add}
            onClick={() => setShowCreateModal(true)}
            size="small"
          >
            Create Recurring Task
          </Button>
        </Flex>

        {upcomingTasks.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #e1e4e8'
          }}>
            <Text type="text2" color="secondary">
              No upcoming recurring tasks in the next 7 days
            </Text>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e1e4e8' }}>
            {upcomingTasks.map((task, index) => (
              <div
                key={task.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: index < upcomingTasks.length - 1 ? '1px solid #e1e4e8' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <Text type="text1" weight="medium">{task.name}</Text>
                  <Text type="text2" color="secondary" style={{ display: 'block', marginTop: '2px' }}>
                    {task.recurrenceType.charAt(0).toUpperCase() + task.recurrenceType.slice(1)} • Board {task.boardId}
                  </Text>
                </div>
                <Text type="text2" weight="medium">
                  {format(new Date(task.nextOccurrence), 'MMM d, h:mm a')}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ 
        padding: '16px', 
        backgroundColor: 'white', 
        borderRadius: '6px',
        border: '1px solid #e1e4e8'
      }}>
        <Text type="text1" weight="medium" style={{ marginBottom: '8px' }}>
          Quick Stats
        </Text>
        <Flex gap="large">
          <div>
            <Text type="text2" color="secondary">Total Active</Text>
            <Text type="text1" weight="bold" style={{ display: 'block' }}>
              {tasks.filter(t => t.status === 'active').length}
            </Text>
          </div>
          <div>
            <Text type="text2" color="secondary">This Week</Text>
            <Text type="text1" weight="bold" style={{ display: 'block' }}>
              {upcomingTasks.length}
            </Text>
          </div>
        </Flex>
      </div>

      {showCreateModal && (
        <RecurringTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
};