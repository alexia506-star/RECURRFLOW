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
  TextField,
  Checkbox,
  DatePicker,
  Toast
} from 'monday-ui-react-core';
import { Edit, Delete, Clock } from 'monday-ui-react-core/icons';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  mondayItemId: string;
  mondayUserId: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  isBillable: boolean;
  notes: string | null;
  createdAt: string;
}

interface TimeEntryListProps {
  mondayAccountId: string;
  mondayUserId?: string;
  mondayItemId?: string;
  refreshTrigger?: number;
}

export const TimeEntryList: React.FC<TimeEntryListProps> = ({
  mondayAccountId,
  mondayUserId,
  mondayItemId,
  refreshTrigger
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    isBillable: false,
    notes: ''
  });

  useEffect(() => {
    fetchTimeEntries();
  }, [mondayAccountId, mondayUserId, mondayItemId, refreshTrigger]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        mondayAccountId
      });
      
      if (mondayUserId) params.append('mondayUserId', mondayUserId);
      if (mondayItemId) params.append('mondayItemId', mondayItemId);
      
      const response = await fetch(`/api/time-tracking/entries?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch time entries');
      }
      
      const data = await response.json();
      setTimeEntries(data);
    } catch (error) {
      Toast.show({
        message: 'Failed to load time entries',
        type: 'negative'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditFormData({
      startTime: format(new Date(entry.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: entry.endTime ? format(new Date(entry.endTime), "yyyy-MM-dd'T'HH:mm") : '',
      isBillable: entry.isBillable,
      notes: entry.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    try {
      const updateData: any = {
        isBillable: editFormData.isBillable,
        notes: editFormData.notes
      };

      if (editFormData.startTime) {
        updateData.startTime = new Date(editFormData.startTime).toISOString();
      }
      
      if (editFormData.endTime) {
        updateData.endTime = new Date(editFormData.endTime).toISOString();
      }

      const response = await fetch(`/api/time-tracking/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update time entry');
      }

      setShowEditModal(false);
      setEditingEntry(null);
      fetchTimeEntries();

      Toast.show({
        message: 'Time entry updated successfully!',
        type: 'positive'
      });
    } catch (error) {
      Toast.show({
        message: error instanceof Error ? error.message : 'Failed to update time entry',
        type: 'negative'
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/time-tracking/entries/${entryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete time entry');
      }

      fetchTimeEntries();

      Toast.show({
        message: 'Time entry deleted successfully!',
        type: 'positive'
      });
    } catch (error) {
      Toast.show({
        message: 'Failed to delete time entry',
        type: 'negative'
      });
    }
  };

  const getTotalHours = (): number => {
    const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    return Math.round((totalSeconds / 3600) * 100) / 100;
  };

  const getBillableHours = (): number => {
    const billableSeconds = timeEntries
      .filter(entry => entry.isBillable)
      .reduce((sum, entry) => sum + entry.durationSeconds, 0);
    return Math.round((billableSeconds / 3600) * 100) / 100;
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ padding: '40px' }}>
        <Loader size="medium" />
        <Text type="text2" style={{ marginTop: '16px' }}>Loading time entries...</Text>
      </Flex>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      borderRadius: '6px',
      border: '1px solid #e1e4e8'
    }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: '20px' }}>
        <Flex align="center" gap="small">
          <Clock size="small" />
          <Text type="text1" weight="medium">Time Entries</Text>
        </Flex>
        
        <Flex gap="large">
          <div style={{ textAlign: 'right' }}>
            <Text type="text2" color="secondary">Total Hours</Text>
            <Text type="text1" weight="bold" style={{ display: 'block' }}>
              {getTotalHours()}h
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text type="text2" color="secondary">Billable Hours</Text>
            <Text type="text1" weight="bold" style={{ display: 'block', color: '#00c875' }}>
              {getBillableHours()}h
            </Text>
          </div>
        </Flex>
      </Flex>

      {timeEntries.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <Text type="text2" color="secondary">
            No time entries found
          </Text>
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '12px',
                borderBottom: '1px solid #e1e4e8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <Flex align="center" gap="small" style={{ marginBottom: '4px' }}>
                  <Text type="text1" weight="medium">
                    {formatDuration(entry.durationSeconds)}
                  </Text>
                  {entry.isBillable && (
                    <span style={{
                      backgroundColor: '#00c875',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      BILLABLE
                    </span>
                  )}
                </Flex>
                
                <Text type="text2" color="secondary">
                  {format(new Date(entry.startTime), 'MMM d, yyyy h:mm a')}
                  {entry.endTime && ` - ${format(new Date(entry.endTime), 'h:mm a')}`}
                </Text>
                
                {entry.notes && (
                  <Text type="text2" style={{ marginTop: '4px', fontStyle: 'italic' }}>
                    {entry.notes}
                  </Text>
                )}
                
                <Text type="text2" color="secondary" style={{ fontSize: '11px' }}>
                  Item: {entry.mondayItemId}
                </Text>
              </div>
              
              <Flex gap="small">
                <Button
                  leftIcon={Edit}
                  kind="tertiary"
                  size="small"
                  onClick={() => handleEditEntry(entry)}
                >
                  Edit
                </Button>
                <Button
                  leftIcon={Delete}
                  kind="tertiary"
                  size="small"
                  color="negative"
                  onClick={() => handleDeleteEntry(entry.id)}
                >
                  Delete
                </Button>
              </Flex>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="medium">
        <ModalHeader title="Edit Time Entry" />
        <ModalContent>
          <div style={{ padding: '20px 0' }}>
            <TextField
              title="Start Time"
              type="datetime-local"
              value={editFormData.startTime}
              onChange={(value) => setEditFormData(prev => ({ ...prev, startTime: value }))}
              style={{ marginBottom: '16px' }}
            />
            
            <TextField
              title="End Time"
              type="datetime-local"
              value={editFormData.endTime}
              onChange={(value) => setEditFormData(prev => ({ ...prev, endTime: value }))}
              style={{ marginBottom: '16px' }}
            />
            
            <Checkbox
              label="Mark as billable"
              checked={editFormData.isBillable}
              onChange={(checked) => setEditFormData(prev => ({ ...prev, isBillable: checked }))}
              style={{ marginBottom: '16px' }}
            />
            
            <TextField
              title="Notes"
              placeholder="Add notes about this time entry..."
              value={editFormData.notes}
              onChange={(value) => setEditFormData(prev => ({ ...prev, notes: value }))}
              multiline
              rows={3}
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Flex justify="space-between" style={{ width: '100%' }}>
            <Button
              kind="tertiary"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateEntry}
              kind="primary"
            >
              Update Entry
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>
    </div>
  );
};