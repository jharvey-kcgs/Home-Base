// types/models.ts

export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  none: 'One time',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

// Widget 1
export interface Event {
  id: string;
  date: string; // "YYYY-MM-DD" - the first/anchor occurrence
  name: string;
  description: string;
  recurrence: RecurrenceRule;
  linkedAlertId: string | null; // set when "Also set a reminder" is on
}

// Widget 2
export interface QuoteCategory {
  id: string;
  name: string;
}

export interface Quote {
  id: string;
  author: string;
  text: string;
  notes: string;
  categoryId: string | null;
}

// Widget 3
export type Priority = 1 | 2 | 3 | 4;

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Moderate',
  4: 'Low',
};

export interface Task {
  id: string;
  name: string;
  priority: Priority;
  dueDate: string | null; // "YYYY-MM-DD" or null
  notes: string;
  isDone: boolean;
  createdAt: string;
}

// Widget 4
// Widget 4
export const HABIT_UNITS = ['Hours', 'Minutes', 'Fl Oz', 'Cups', 'Miles', 'Calories'] as const;
export type HabitUnit = (typeof HABIT_UNITS)[number];

export interface HabitSlider {
  id: string;
  name: string;
  unit: HabitUnit;
  maxValue: number;
  value: number;
  sortOrder: number;
}

export interface HabitCheck {
  id: string;
  name: string;
  isChecked: boolean;
  sortOrder: number;
}

// Daily snapshots kept when habits reset each day, for the Habit Report.
export interface SliderLogEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  unit: HabitUnit;
  value: number;
  maxValue: number;
}

export interface CheckLogEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  isChecked: boolean;
}

// Widget 5
export const NOTIFICATION_OFFSETS = [0, 5, 10, 15, 30, 60] as const;
export type NotificationOffset = (typeof NOTIFICATION_OFFSETS)[number];

export interface Alert {
  id: string;
  name: string;
  isAllDay: boolean;
  date: string; // "YYYY-MM-DD" - always required
  time: string | null; // "HH:MM" 24hr - required unless isAllDay
  notes: string;
  notificationOffsetMinutes: NotificationOffset | null; // 0 = at the time; null only exists on old data from before this was required
  notificationId: string | null;
  recurrence: RecurrenceRule; // follows the linked Event's recurrence, or 'none' for a standalone alert
  isCompleted: boolean;
  createdAt: string;
}

// Widget 6
export interface Thought {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

// Settings
export type ThemeMode = 'light' | 'dark';
export type FontSize = 'small' | 'default' | 'large';

export interface AppSettings {
  userName: string | null;
  themeMode: ThemeMode;
  fontSize: FontSize;
  themeColor: string;
  notificationsEnabled: boolean;
  vacationStart: string | null; // "YYYY-MM-DD"
  vacationEnd: string | null; // "YYYY-MM-DD"
}

export const DEFAULT_SETTINGS: AppSettings = {
  userName: null,
  themeMode: 'light',
  fontSize: 'default',
  themeColor: '#007AFF',
  notificationsEnabled: true,
  vacationStart: null,
  vacationEnd: null,
};

export const THEME_COLORS: { name: string; hex: string }[] = [
  { name: 'Cream', hex: '#F7F3EC' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Purple', hex: '#6200EE' },
  { name: 'Brown', hex: '#8B5A2B' },
  { name: 'Green', hex: '#34C759' },
  { name: 'Blue', hex: '#007AFF' },
  { name: 'Pink', hex: '#FF2D55' },
  { name: 'Red', hex: '#FF3B30' },
  { name: 'Yellow', hex: '#FFCC00' },
];
