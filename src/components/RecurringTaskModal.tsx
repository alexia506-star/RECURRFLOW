import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  TextField,
  Dropdown,
  Checkbox,
  DatePicker,
  Flex,
  Text,
  Steps,
  StepIndicator,
  Toast
} from 'monday-ui-react-core';
import { format } from 'date-fns';

const recurrenceSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  templateItemId: z.string().min(1, 'Template item is required'),
  boardId: z.string().min(1, 'Board is required'),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().min(1).default(1),
  selectedDays: z.array(z.number()).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  weekNumber: z.number().min(1).max(5).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  skipWeekends: z.boolean().default(false),
  skipHolidays: z.boolean().default(false),
  advanceCreationDays: z.number().min(0).max(30).default(0),
  assigneeRotation: z.array(z.string()).optional()
});

type RecurrenceFormData = z.infer<typeof recurrenceSchema>;

interface RecurringTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const DAYS_OF_WEEK = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 }
];

const RECURRENCE_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
];

export const RecurringTaskModal: React.FC<RecurringTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<RecurrenceFormData>({
    resolver: zodResolver(recurrenceSchema),
    defaultValues: {
      interval: 1,
      skipWeekends: false,
      skipHolidays: false,
      advanceCreationDays: 0,
      startDate: new Date(),
      selectedDays: [1, 2, 3, 4, 5] // Default to weekdays
    }
  });

  const recurrenceType = watch('recurrenceType');
  const selectedDays = watch('selectedDays');

  const handleClose = () => {
    reset();
    setCurrentStep(0);
    onClose();
  };

  const onSubmit = async (data: RecurrenceFormData) => {
    try {
      setIsSubmitting(true);

      // Build recurrence value based on type
      let recurrenceValue: any = {
        interval: data.interval,
        skipWeekends: data.skipWeekends
      };

      if (data.recurrenceType === 'weekly' && data.selectedDays) {
        recurrenceValue.days = data.selectedDays;
      } else if (data.recurrenceType === 'monthly') {
        if (data.dayOfMonth) {
          recurrenceValue.dayOfMonth = data.dayOfMonth;
        } else if (data.weekNumber && data.dayOfWeek !== undefined) {
          recurrenceValue.weekNumber = data.weekNumber;
          recurrenceValue.dayOfWeek = data.dayOfWeek;
        }
      }

      const payload = {
        mondayAccountId: 'demo_account', // This would come from auth context
        boardId: data.boardId,
        templateItemId: data.templateItemId,
        name: data.name,
        recurrenceType: data.recurrenceType,
        recurrenceValue,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
        assigneeRotation: data.assigneeRotation || [],
        skipHolidays: data.skipHolidays,
        advanceCreationDays: data.advanceCreationDays
      };

      const response = await fetch('/api/recurring-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create recurring task');
      }

      onTaskCreated();
    } catch (error) {
      Toast.show({
        message: error instanceof Error ? error.message : 'Failed to create recurring task',
        type: 'negative'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ padding: '20px 0' }}>
            <Text type="h4" style={{ marginBottom: '16px' }}>Template Selection</Text>
            
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  title="Task Name"
                  placeholder="Enter task name"
                  validation={errors.name ? { status: 'error', text: errors.name.message } : undefined}
                  style={{ marginBottom: '16px' }}
                />
              )}
            />

            <Controller
              name="boardId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  title="Board ID"
                  placeholder="Enter monday.com board ID"
                  validation={errors.boardId ? { status: 'error', text: errors.boardId.message } : undefined}
                  style={{ marginBottom: '16px' }}
                />
              )}
            />

            <Controller
              name="templateItemId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  title="Template Item ID"
                  placeholder="Enter template item ID to copy"
                  validation={errors.templateItemId ? { status: 'error', text: errors.templateItemId.message } : undefined}
                />
              )}
            />
          </div>
        );

      case 1:
        return (
          <div style={{ padding: '20px 0' }}>
            <Text type="h4" style={{ marginBottom: '16px' }}>Recurrence Pattern</Text>
            
            <Controller
              name="recurrenceType"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  placeholder="Select recurrence type"
                  options={RECURRENCE_OPTIONS}
                  style={{ marginBottom: '16px' }}
                />
              )}
            />

            <Controller
              name="interval"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value?.toString()}
                  onChange={(value) => field.onChange(parseInt(value) || 1)}
                  title={`Every ${recurrenceType || 'period'}(s)`}
                  type="number"
                  min={1}
                  style={{ marginBottom: '16px' }}
                />
              )}
            />

            {recurrenceType === 'weekly' && (
              <div style={{ marginBottom: '16px' }}>
                <Text type="text1" style={{ marginBottom: '8px' }}>Select Days</Text>
                <Flex gap="small" wrap>
                  {DAYS_OF_WEEK.map((day) => (
                    <Controller
                      key={day.value}
                      name="selectedDays"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          label={day.label.slice(0, 3)}
                          checked={field.value?.includes(day.value) || false}
                          onChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, day.value]);
                            } else {
                              field.onChange(current.filter(d => d !== day.value));
                            }
                          }}
                        />
                      )}
                    />
                  ))}
                </Flex>
              </div>
            )}

            {recurrenceType === 'monthly' && (
              <Controller
                name="dayOfMonth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value?.toString() || ''}
                    onChange={(value) => field.onChange(parseInt(value) || undefined)}
                    title="Day of Month (1-31)"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="e.g., 15 for 15th of each month"
                  />
                )}
              />
            )}
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '20px 0' }}>
            <Text type="h4" style={{ marginBottom: '16px' }}>Schedule & Options</Text>
            
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  date={field.value}
                  onPickDate={field.onChange}
                  placeholder="Select start date"
                  style={{ marginBottom: '16px' }}
                />
              )}
            />

            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  date={field.value}
                  onPickDate={field.onChange}
                  placeholder="Select end date (optional)"
                  style={{ marginBottom: '16px' }}
                />
              )}
            />

            <Controller
              name="skipWeekends"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  checked={field.value}
                  label="Skip weekends"
                  style={{ marginBottom: '12px' }}
                />
              )}
            />

            <Controller
              name="skipHolidays"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  checked={field.value}
                  label="Skip holidays"
                  style={{ marginBottom: '16px' }}
                />
              )}
            />

            <Controller
              name="advanceCreationDays"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value?.toString()}
                  onChange={(value) => field.onChange(parseInt(value) || 0)}
                  title="Create tasks in advance (days)"
                  type="number"
                  min={0}
                  max={30}
                  placeholder="0"
                />
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return watch('name') && watch('boardId') && watch('templateItemId');
      case 1:
        return watch('recurrenceType') && watch('interval');
      case 2:
        return watch('startDate');
      default:
        return false;
    }
  };

  return (
    <Modal show={isOpen} onClose={handleClose} size="medium">
      <ModalHeader title="Create Recurring Task" />
      <ModalContent>
        <Steps
          steps={[
            { titleText: 'Template', status: currentStep > 0 ? 'fulfilled' : currentStep === 0 ? 'active' : 'pending' },
            { titleText: 'Recurrence', status: currentStep > 1 ? 'fulfilled' : currentStep === 1 ? 'active' : 'pending' },
            { titleText: 'Options', status: currentStep === 2 ? 'active' : 'pending' }
          ]}
          type="numbers"
        />
        
        {renderStepContent()}
      </ModalContent>
      <ModalFooter>
        <Flex justify="space-between" style={{ width: '100%' }}>
          <Button
            kind="tertiary"
            onClick={currentStep === 0 ? handleClose : () => setCurrentStep(currentStep - 1)}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          <Flex gap="small">
            {currentStep < 2 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={!canProceed()}
              >
                Create Recurring Task
              </Button>
            )}
          </Flex>
        </Flex>
      </ModalFooter>
    </Modal>
  );
};