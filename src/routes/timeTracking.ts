import express from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ensureAuthenticated } from '../middleware/auth';
import { CreateTimeEntrySchema, UpdateTimeEntrySchema, StartTimerSchema, StopTimerSchema } from '../validation/schemas';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// GET /api/time-tracking/entries - List time entries
router.get('/entries', async (req, res) => {
  try {
    const { mondayAccountId, mondayUserId, mondayItemId, startDate, endDate } = req.query;
    
    if (!mondayAccountId) {
      return res.status(400).json({ error: 'mondayAccountId is required' });
    }

    const where: any = {
      mondayAccountId: mondayAccountId as string
    };

    if (mondayUserId) {
      where.mondayUserId = mondayUserId as string;
    }

    if (mondayItemId) {
      where.mondayItemId = mondayItemId as string;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: 100 // Limit to last 100 entries
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// POST /api/time-tracking/entries - Create time entry
router.post('/entries', async (req, res) => {
  try {
    const validatedData = CreateTimeEntrySchema.parse(req.body);
    
    // Calculate duration if both start and end times are provided
    let durationSeconds = validatedData.durationSeconds;
    if (validatedData.startTime && validatedData.endTime) {
      const start = new Date(validatedData.startTime);
      const end = new Date(validatedData.endTime);
      durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        durationSeconds
      }
    });

    res.status(201).json(timeEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// PUT /api/time-tracking/entries/:id - Update time entry
router.put('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateTimeEntrySchema.parse(req.body);

    // Check if entry exists
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    // Recalculate duration if times are updated
    let updateData: any = { ...validatedData };
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime);
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime);
    }

    // Recalculate duration if both times are present
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || existingEntry.startTime;
      const endTime = updateData.endTime || existingEntry.endTime;
      
      if (startTime && endTime) {
        updateData.durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      }
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData
    });

    res.json(updatedEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// DELETE /api/time-tracking/entries/:id - Delete time entry
router.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEntry = await prisma.timeEntry.delete({
      where: { id }
    });

    res.json({ success: true, deletedEntry });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// GET /api/time-tracking/timer/:userId - Get active timer for user
router.get('/timer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const activeTimer = await prisma.activeTimer.findUnique({
      where: { mondayUserId: userId }
    });

    if (!activeTimer) {
      return res.json({ active: false });
    }

    // Calculate current duration
    const currentDuration = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000);

    res.json({
      active: true,
      timer: {
        ...activeTimer,
        currentDuration
      }
    });
  } catch (error) {
    console.error('Error fetching active timer:', error);
    res.status(500).json({ error: 'Failed to fetch active timer' });
  }
});

// POST /api/time-tracking/timer/start - Start timer
router.post('/timer/start', async (req, res) => {
  try {
    const validatedData = StartTimerSchema.parse(req.body);

    // Check if user already has an active timer
    const existingTimer = await prisma.activeTimer.findUnique({
      where: { mondayUserId: validatedData.mondayUserId }
    });

    if (existingTimer) {
      return res.status(400).json({ error: 'Timer already active for this user' });
    }

    const activeTimer = await prisma.activeTimer.create({
      data: {
        mondayUserId: validatedData.mondayUserId,
        mondayItemId: validatedData.mondayItemId,
        startTime: new Date()
      }
    });

    res.status(201).json(activeTimer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// POST /api/time-tracking/timer/stop - Stop timer and create time entry
router.post('/timer/stop', async (req, res) => {
  try {
    const validatedData = StopTimerSchema.parse(req.body);

    // Find active timer
    const activeTimer = await prisma.activeTimer.findUnique({
      where: { mondayUserId: validatedData.mondayUserId }
    });

    if (!activeTimer) {
      return res.status(404).json({ error: 'No active timer found for this user' });
    }

    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);

    // Create time entry and delete active timer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create time entry
      const timeEntry = await tx.timeEntry.create({
        data: {
          mondayAccountId: 'demo_account', // This would come from auth context
          mondayItemId: activeTimer.mondayItemId,
          mondayUserId: validatedData.mondayUserId,
          startTime: activeTimer.startTime,
          endTime,
          durationSeconds,
          isBillable: validatedData.isBillable,
          notes: validatedData.notes
        }
      });

      // Delete active timer
      await tx.activeTimer.delete({
        where: { mondayUserId: validatedData.mondayUserId }
      });

      return timeEntry;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// GET /api/time-tracking/reports/summary - Get time tracking summary
router.get('/reports/summary', async (req, res) => {
  try {
    const { mondayAccountId, mondayUserId, startDate, endDate } = req.query;
    
    if (!mondayAccountId) {
      return res.status(400).json({ error: 'mondayAccountId is required' });
    }

    const where: any = {
      mondayAccountId: mondayAccountId as string
    };

    if (mondayUserId) {
      where.mondayUserId = mondayUserId as string;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      select: {
        durationSeconds: true,
        isBillable: true,
        mondayUserId: true,
        mondayItemId: true
      }
    });

    // Calculate summary statistics
    const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    const billableSeconds = timeEntries.filter(entry => entry.isBillable)
      .reduce((sum, entry) => sum + entry.durationSeconds, 0);
    
    const uniqueUsers = new Set(timeEntries.map(entry => entry.mondayUserId)).size;
    const uniqueItems = new Set(timeEntries.map(entry => entry.mondayItemId)).size;

    const summary = {
      totalEntries: timeEntries.length,
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
      billableHours: Math.round((billableSeconds / 3600) * 100) / 100,
      nonBillableHours: Math.round(((totalSeconds - billableSeconds) / 3600) * 100) / 100,
      uniqueUsers,
      uniqueItems,
      averageEntryDuration: timeEntries.length > 0 ? Math.round((totalSeconds / timeEntries.length / 60) * 100) / 100 : 0 // in minutes
    };

    res.json(summary);
  } catch (error) {
    console.error('Error generating time tracking summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;