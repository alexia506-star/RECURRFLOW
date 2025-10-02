// Common types for the application
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface MondayContext {
  accountId: string;
  userId: string;
  boardId?: string;
  itemId?: string;
}

// Recurring task types
export interface RecurringTask {
  id: string;
  monday_account_id: string;
  board_id: string;
  template_item_id: string;
  name: string;
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_value: {
    interval?: number;
    days?: number[];
    skipWeekends?: boolean;
    dayOfMonth?: number;
    weekNumber?: number;
    dayOfWeek?: number;
  };
  start_date: Date;
  end_date?: Date;
  next_occurrence: Date;
  assignee_rotation?: string[];
  skip_holidays: boolean;
  advance_creation_days: number;
  status: 'active' | 'paused' | 'completed';
  created_at: Date;
  updated_at: Date;
}

// Time entry types
export interface TimeEntry {
  id: string;
  monday_account_id: string;
  monday_item_id: string;
  monday_user_id: string;
  start_time: Date;
  end_time?: Date;
  duration_seconds: number;
  is_billable: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Monday.com OAuth token response
export interface MondayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface ActiveTimer {
  id: string;
  monday_user_id: string;
  monday_item_id: string;
  start_time: Date;
  updated_at: Date;
}