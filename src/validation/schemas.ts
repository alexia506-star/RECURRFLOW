import { z } from 'zod';

// Recurring task validation schemas
export const RecurrenceValueSchema = z.object({
  interval: z.number().min(1).optional(),
  days: z.array(z.number().min(0).max(6)).optional(), // 0-6 for Sunday-Saturday
  skipWeekends: z.boolean().optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  weekNumber: z.number().min(1).max(5).optional(), // 1st, 2nd, 3rd, 4th, 5th
  dayOfWeek: z.number().min(0).max(6).optional() // 0-6 for Sunday-Saturday
});

export const CreateRecurringTaskSchema = z.object({
  mondayAccountId: z.string().min(1),
  boardId: z.string().min(1),
  templateItemId: z.string().min(1),
  name: z.string().min(1).max(500),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  recurrenceValue: RecurrenceValueSchema,
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  assigneeRotation: z.array(z.string()).optional(),
  skipHolidays: z.boolean().default(false),
  advanceCreationDays: z.number().min(0).max(30).default(0)
});

export const UpdateRecurringTaskSchema = CreateRecurringTaskSchema.partial().omit({
  mondayAccountId: true
});

// Time entry validation schemas
export const CreateTimeEntrySchema = z.object({
  mondayAccountId: z.string().min(1),
  mondayItemId: z.string().min(1),
  mondayUserId: z.string().min(1),
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()).optional(),
  durationSeconds: z.number().min(0).default(0),
  isBillable: z.boolean().default(false),
  notes: z.string().max(1000).optional()
});

export const UpdateTimeEntrySchema = CreateTimeEntrySchema.partial().omit({
  mondayAccountId: true,
  mondayUserId: true
});

// Timer validation schemas
export const StartTimerSchema = z.object({
  mondayUserId: z.string().min(1),
  mondayItemId: z.string().min(1)
});

export const StopTimerSchema = z.object({
  mondayUserId: z.string().min(1),
  isBillable: z.boolean().default(false),
  notes: z.string().max(1000).optional()
});