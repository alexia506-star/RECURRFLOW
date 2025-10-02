import { addDays, addWeeks, addMonths, addYears, isWeekend, format, setDate, getDay, startOfMonth } from 'date-fns';

export interface RecurrenceRule {
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_value: {
    interval?: number;
    days?: number[]; // 0-6 for Sunday-Saturday
    skipWeekends?: boolean;
    dayOfMonth?: number;
    weekNumber?: number; // 1st, 2nd, 3rd, 4th, 5th
    dayOfWeek?: number; // 0-6 for Sunday-Saturday
  };
  skip_holidays?: boolean;
  start_date: Date;
  end_date?: Date;
}

export interface HolidayCalendar {
  holidays: Array<{ date: string; name: string }>;
}

export function calculateNextOccurrence(
  rule: RecurrenceRule,
  currentDate: Date,
  holidayCalendar?: HolidayCalendar
): Date {
  let nextDate = new Date(currentDate);
  
  switch (rule.recurrence_type) {
    case 'daily':
      nextDate = addDays(currentDate, rule.recurrence_value.interval || 1);
      break;
      
    case 'weekly':
      if (rule.recurrence_value.days && rule.recurrence_value.days.length > 0) {
        nextDate = getNextWeekday(currentDate, rule.recurrence_value.days, rule.recurrence_value.interval || 1);
      } else {
        nextDate = addWeeks(currentDate, rule.recurrence_value.interval || 1);
      }
      break;
      
    case 'monthly':
      if (rule.recurrence_value.dayOfMonth) {
        nextDate = addMonths(currentDate, rule.recurrence_value.interval || 1);
        nextDate = setDate(nextDate, rule.recurrence_value.dayOfMonth);
      } else if (rule.recurrence_value.weekNumber && rule.recurrence_value.dayOfWeek !== undefined) {
        // "3rd Tuesday" logic
        nextDate = getNthWeekdayOfMonth(
          addMonths(currentDate, rule.recurrence_value.interval || 1),
          rule.recurrence_value.weekNumber,
          rule.recurrence_value.dayOfWeek
        );
      } else {
        nextDate = addMonths(currentDate, rule.recurrence_value.interval || 1);
      }
      break;
      
    case 'yearly':
      nextDate = addYears(currentDate, rule.recurrence_value.interval || 1);
      break;
      
    default:
      nextDate = addDays(currentDate, 1);
  }

  // Skip weekends if enabled
  if (rule.recurrence_value.skipWeekends) {
    while (isWeekend(nextDate)) {
      nextDate = addDays(nextDate, 1);
    }
  }

  // Skip holidays if enabled
  if (rule.skip_holidays && holidayCalendar) {
    while (isHoliday(nextDate, holidayCalendar)) {
      nextDate = addDays(nextDate, 1);
      // Also skip weekends after holiday adjustment
      if (rule.recurrence_value.skipWeekends) {
        while (isWeekend(nextDate)) {
          nextDate = addDays(nextDate, 1);
        }
      }
    }
  }

  return nextDate;
}

function getNextWeekday(currentDate: Date, days: number[], interval: number): Date {
  const currentDay = getDay(currentDate);
  let nextDate = new Date(currentDate);
  
  // Sort days to find next occurrence
  const sortedDays = [...days].sort((a, b) => a - b);
  
  // Find next day in current week
  const nextDayInWeek = sortedDays.find(day => day > currentDay);
  
  if (nextDayInWeek !== undefined) {
    // Next occurrence is in current week
    const daysToAdd = nextDayInWeek - currentDay;
    nextDate = addDays(currentDate, daysToAdd);
  } else {
    // Next occurrence is in next interval week
    const weeksToAdd = interval;
    const firstDayOfWeek = sortedDays[0];
    nextDate = addWeeks(currentDate, weeksToAdd);
    const dayDiff = firstDayOfWeek - getDay(nextDate);
    nextDate = addDays(nextDate, dayDiff);
  }
  
  return nextDate;
}

function getNthWeekdayOfMonth(date: Date, weekNumber: number, dayOfWeek: number): Date {
  const firstDayOfMonth = startOfMonth(date);
  const firstDayOfWeek = getDay(firstDayOfMonth);
  
  // Calculate days to add to get to the first occurrence of the target day
  let daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7;
  
  // Add weeks to get to the nth occurrence
  daysToAdd += (weekNumber - 1) * 7;
  
  return addDays(firstDayOfMonth, daysToAdd);
}

function isHoliday(date: Date, holidayCalendar: HolidayCalendar): boolean {
  const dateString = format(date, 'yyyy-MM-dd');
  return holidayCalendar.holidays.some(holiday => holiday.date === dateString);
}

// Helper function to get next assignee in rotation
export function getNextAssignee(assigneeRotation: string[], currentIndex: number = 0): string | undefined {
  if (!assigneeRotation || assigneeRotation.length === 0) {
    return undefined;
  }
  
  return assigneeRotation[currentIndex % assigneeRotation.length];
}