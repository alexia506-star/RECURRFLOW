import React, { useState, useEffect } from 'react';
import {
  Button,
  Flex,
  Text,
  TextField,
  Checkbox,
  Toast,
  Loader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter
} from 'monday-ui-react-core';
import { PlayOutline, Square, Clock } from 'monday-ui-react-core/icons';

interface ActiveTimer {
  id: string;
  mondayUserId: string;
  mondayItemId: string;
  startTime: string;
  currentDuration: number;
}

interface TimerWidgetProps {
  mondayUserId: string;
  mondayItemId?: string;
  onTimeEntryCreated?: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  mondayUserId,
  mondayItemId,
  onTimeEntryCreated
}) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopTimerData, setStopTimerData] = useState({
    isBillable: false,
    notes: ''
  });

  // Update timer display every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTimer) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
        setCurrentDuration(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  // Check for active timer on mount
  useEffect(() => {
    checkActiveTimer();
  }, [mondayUserId]);

  const checkActiveTimer = async () => {
    try {
      const response = await fetch(`/api/time-tracking/timer/${mondayUserId}`);
      const data = await response.json();
      
      if (data.active) {
        setActiveTimer(data.timer);
        setCurrentDuration(data.timer.currentDuration);
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const startTimer = async () => {
    if (!mondayItemId) {
      Toast.show({
        message: 'Please select an item to track time for',
        type: 'negative'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/time-tracking/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mondayUserId,
          mondayItemId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start timer');
      }

      const timer = await response.json();
      setActiveTimer({
        ...timer,
        currentDuration: 0
      });
      setCurrentDuration(0);

      Toast.show({
        message: 'Timer started!',
        type: 'positive'
      });
    } catch (error) {
      Toast.show({
        message: error instanceof Error ? error.message : 'Failed to start timer',
        type: 'negative'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/time-tracking/timer/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mondayUserId,
          isBillable: stopTimerData.isBillable,
          notes: stopTimerData.notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop timer');
      }

      setActiveTimer(null);
      setCurrentDuration(0);
      setShowStopModal(false);
      setStopTimerData({ isBillable: false, notes: '' });

      Toast.show({
        message: 'Timer stopped and time entry created!',
        type: 'positive'
      });

      if (onTimeEntryCreated) {
        onTimeEntryCreated();
      }
    } catch (error) {
      Toast.show({
        message: error instanceof Error ? error.message : 'Failed to stop timer',
        type: 'negative'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      padding: '16px', 
      backgroundColor: 'white', 
      borderRadius: '6px',
      border: '1px solid #e1e4e8'
    }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: '12px' }}>
        <Flex align="center" gap="small">
          <Clock size="small" />
          <Text type="text1" weight="medium">Time Tracker</Text>
        </Flex>
        
        {activeTimer && (
          <Text type="text1" weight="bold" style={{ 
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#00c875'
          }}>
            {formatDuration(currentDuration)}
          </Text>
        )}
      </Flex>

      {activeTimer ? (
        <div>
          <Text type="text2" color="secondary" style={{ marginBottom: '12px' }}>
            Tracking time for item: {activeTimer.mondayItemId}
          </Text>
          
          <Button
            leftIcon={Square}
            onClick={() => setShowStopModal(true)}
            loading={isLoading}
            kind="secondary"
            color="negative"
            size="small"
            style={{ width: '100%' }}
          >
            Stop Timer
          </Button>
        </div>
      ) : (
        <div>
          {!mondayItemId && (
            <Text type="text2" color="secondary" style={{ marginBottom: '12px' }}>
              Select an item to start tracking time
            </Text>
          )}
          
          <Button
            leftIcon={PlayOutline}
            onClick={startTimer}
            loading={isLoading}
            disabled={!mondayItemId}
            kind="primary"
            size="small"
            style={{ width: '100%' }}
          >
            Start Timer
          </Button>
        </div>
      )}

      {/* Stop Timer Modal */}
      <Modal show={showStopModal} onClose={() => setShowStopModal(false)} size="small">
        <ModalHeader title="Stop Timer" />
        <ModalContent>
          <div style={{ padding: '20px 0' }}>
            <Text type="text1" style={{ marginBottom: '16px' }}>
              Total time: <strong>{formatDuration(currentDuration)}</strong>
            </Text>
            
            <Checkbox
              label="Mark as billable"
              checked={stopTimerData.isBillable}
              onChange={(checked) => setStopTimerData(prev => ({ ...prev, isBillable: checked }))}
              style={{ marginBottom: '16px' }}
            />
            
            <TextField
              title="Notes (optional)"
              placeholder="Add notes about this time entry..."
              value={stopTimerData.notes}
              onChange={(value) => setStopTimerData(prev => ({ ...prev, notes: value }))}
              multiline
              rows={3}
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Flex justify="space-between" style={{ width: '100%' }}>
            <Button
              kind="tertiary"
              onClick={() => setShowStopModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={stopTimer}
              loading={isLoading}
              kind="primary"
            >
              Stop & Save
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>
    </div>
  );
};