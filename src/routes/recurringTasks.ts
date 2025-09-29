import express from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ensureAuthenticated } from '../middleware/auth';
import { CreateRecurringTaskSchema, UpdateRecurringTaskSchema } from '../validation/schemas';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// GET /api/recurring-tasks - List all recurring tasks
router.get('/', async (req, res) => {
  try {
    const { mondayAccountId } = req.query;
    
    if (!mondayAccountId) {
      return res.status(400).json({ error: 'mondayAccountId is required' });
    }

    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        mondayAccountId: mondayAccountId as string
      },
      include: {
        taskInstances: {
          orderBy: { scheduledDate: 'desc' },
          take: 5 // Get last 5 instances
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(recurringTasks);
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    res.status(500).json({ error: 'Failed to fetch recurring tasks' });
  }
});

// POST /api/recurring-tasks - Create new recurring task
router.post('/', async (req, res) => {
  try {
    const validatedData = CreateRecurringTaskSchema.parse(req.body);
    
    // Calculate initial next occurrence
    const nextOccurrence = calculateNextOccurrence(
      validatedData.recurrenceType,
      validatedData.recurrenceValue,
      new Date(validatedData.startDate)
    );

    const recurringTask = await prisma.recurringTask.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        nextOccurrence
      }
    });

    res.status(201).json(recurringTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating recurring task:', error);
    res.status(500).json({ error: 'Failed to create recurring task' });
  }
});

// PUT /api/recurring-tasks/:id - Update recurring task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateRecurringTaskSchema.parse(req.body);

    // Check if task exists
    const existingTask = await prisma.recurringTask.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    // Recalculate next occurrence if recurrence rules changed
    let nextOccurrence = existingTask.nextOccurrence;
    if (validatedData.recurrenceType || validatedData.recurrenceValue || validatedData.startDate) {
      nextOccurrence = calculateNextOccurrence(
        validatedData.recurrenceType || existingTask.recurrenceType,
        validatedData.recurrenceValue || existingTask.recurrenceValue,
        validatedData.startDate ? new Date(validatedData.startDate) : existingTask.startDate
      );
    }

    const updatedTask = await prisma.recurringTask.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        nextOccurrence
      }
    });

    res.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating recurring task:', error);
    res.status(500).json({ error: 'Failed to update recurring task' });
  }
});

// DELETE /api/recurring-tasks/:id - Delete recurring task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await prisma.recurringTask.delete({
      where: { id }
    });

    res.json({ success: true, deletedTask });
  } catch (error) {
    console.error('Error deleting recurring task:', error);
    res.status(500).json({ error: 'Failed to delete recurring task' });
  }
});

// Helper function to calculate next occurrence
function calculateNextOccurrence(
  recurrenceType: string,
  recurrenceValue: any,
  startDate: Date
): Date {
  const nextDate = new Date(startDate);
  
  switch (recurrenceType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + (recurrenceValue.interval || 1));
      break;
    case 'weekly':
      // For now, simple weekly increment - will be enhanced in next phase
      nextDate.setDate(nextDate.getDate() + 7 * (recurrenceValue.interval || 1));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + (recurrenceValue.interval || 1));
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + (recurrenceValue.interval || 1));
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}

export default router;