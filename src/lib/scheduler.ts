import Bull from 'bull';
import prisma from './database';
import { calculateNextOccurrence, getNextAssignee } from './recurrence';

// Initialize Bull queue
const taskQueue = new Bull('recurring tasks', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

// Monday.com API helper (mock for now - will be replaced with actual API calls)
const mondayAPI = {
  async duplicateItem(templateItemId: string, boardId: string): Promise<{ id: string }> {
    // Mock implementation - replace with actual monday.com API call
    console.log(`Duplicating item ${templateItemId} in board ${boardId}`);
    return { id: `item_${Date.now()}` };
  },

  async updateItem(itemId: string, updates: any): Promise<void> {
    // Mock implementation - replace with actual monday.com API call
    console.log(`Updating item ${itemId} with:`, updates);
  }
};

// Process recurring task creation jobs
taskQueue.process('createScheduledTasks', async (job) => {
  console.log('Processing scheduled task creation job...');
  
  try {
    const now = new Date();
    
    // Find all recurring tasks that are due for creation
    const dueTasks = await prisma.recurringTask.findMany({
      where: {
        status: 'active',
        nextOccurrence: {
          lte: now
        }
      },
      include: {
        taskInstances: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    console.log(`Found ${dueTasks.length} tasks due for creation`);

    for (const task of dueTasks) {
      try {
        // Check if we should create in advance
        const creationDate = new Date(task.nextOccurrence);
        creationDate.setDate(creationDate.getDate() - task.advanceCreationDays);
        
        if (creationDate > now) {
          continue; // Not yet time to create
        }

        // Clone template item via monday API
        const newItem = await mondayAPI.duplicateItem(
          task.templateItemId,
          task.boardId
        );

        // Determine assignee (rotation logic)
        const lastInstance = task.taskInstances[0];
        const currentRotationIndex = lastInstance ? 
          (JSON.parse(lastInstance.mondayItemId || '0') + 1) % (task.assigneeRotation as string[])?.length || 0 : 0;
        
        const assignee = getNextAssignee(task.assigneeRotation as string[], currentRotationIndex);

        // Update item with scheduled date and assignee
        await mondayAPI.updateItem(newItem.id, {
          date: task.nextOccurrence,
          status: 'Not Started',
          assignee: assignee
        });

        // Record instance in database
        await prisma.taskInstance.create({
          data: {
            recurringTaskId: task.id,
            mondayItemId: newItem.id,
            scheduledDate: task.nextOccurrence,
            status: 'pending'
          }
        });

        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(
          {
            recurrence_type: task.recurrenceType as any,
            recurrence_value: task.recurrenceValue as any,
            skip_holidays: task.skipHolidays,
            start_date: task.startDate,
            end_date: task.endDate
          },
          task.nextOccurrence
        );

        // Update recurring task with next occurrence
        await prisma.recurringTask.update({
          where: { id: task.id },
          data: { 
            nextOccurrence,
            updatedAt: new Date()
          }
        });

        console.log(`Created instance for task: ${task.name}, next occurrence: ${nextOccurrence}`);

      } catch (error) {
        console.error(`Error creating instance for task ${task.id}:`, error);
        // Continue with other tasks even if one fails
      }
    }

    return { processed: dueTasks.length };
    
  } catch (error) {
    console.error('Error in createScheduledTasks job:', error);
    throw error;
  }
});

// Schedule the recurring job to run every hour
export function startScheduler() {
  // Add recurring job that runs every hour
  taskQueue.add('createScheduledTasks', {}, {
    repeat: { cron: '0 * * * *' }, // Every hour at minute 0
    removeOnComplete: 10,
    removeOnFail: 5
  });

  console.log('📅 Recurring task scheduler started - running every hour');
}

// Manual trigger for testing
export async function triggerTaskCreation() {
  return taskQueue.add('createScheduledTasks', {});
}

export default taskQueue;