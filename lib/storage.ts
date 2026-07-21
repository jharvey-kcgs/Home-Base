// lib/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  Event,
  Quote,
  QuoteCategory,
  Task,
  Priority,
  HabitSlider,
  HabitCheck,
  HabitUnit,
  SliderLogEntry,
  CheckLogEntry,
  Thought,
  Alert,
  AppSettings,
  DEFAULT_SETTINGS,
  RecurrenceRule,
} from '../types/models';

const KEYS = {
  events: 'bitbase:events',
  quotes: 'bitbase:quotes',
  quoteCategories: 'bitbase:quoteCategories',
  quoteOfDay: 'bitbase:quoteOfDay',
  tasks: 'bitbase:tasks',
  habitSliders: 'bitbase:habitSliders',
  habitChecks: 'bitbase:habitChecks',
  habitSliderLogs: 'bitbase:habitSliderLogs',
  habitCheckLogs: 'bitbase:habitCheckLogs',
  lastHabitResetDate: 'bitbase:lastHabitResetDate',
  thoughts: 'bitbase:thoughts',
  alerts: 'bitbase:alerts',
  settings: 'bitbase:settings',
};

async function getAll<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (err) {
    console.warn(`Home Base: corrupted data at "${key}", showing empty instead of crashing.`, err);
    return [];
  }
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

const newId = () => uuidv4();
const todayStr = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

// --- Backup: export / import everything ---
export interface BackupPayload {
  app: 'home-base';
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
}

/** Serializes every stored key into one JSON string, for backup/transfer. */
export async function exportAllData(): Promise<string> {
  const allKeys = Object.values(KEYS);
  const pairs = await AsyncStorage.multiGet(allKeys);
  const data: Record<string, string> = {};
  for (const [key, value] of pairs) {
    if (value !== null) data[key] = value;
  }
  const payload: BackupPayload = {
    app: 'home-base',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Restores data from a backup produced by exportAllData(). Replaces
 * anything currently stored under the same keys. Throws if the JSON
 * isn't a recognizable Home Base backup, so the caller can show an
 * error instead of silently corrupting data.
 */
export async function importAllData(jsonString: string): Promise<void> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('That doesn\'t look like valid backup text.');
  }
  if (!parsed || parsed.app !== 'home-base' || typeof parsed.data !== 'object') {
    throw new Error('That doesn\'t look like a Home Base backup.');
  }

  const validKeys = new Set(Object.values(KEYS));
  const entries = Object.entries(parsed.data).filter(
    ([key, value]) => validKeys.has(key) && typeof value === 'string'
  ) as [string, string][];

  if (entries.length === 0) {
    throw new Error('That backup had nothing recognizable to restore.');
  }

  await AsyncStorage.multiSet(entries);
}

// --- Clear Completed (Task Base + Alert Base) ---
export async function clearCompletedTasks(): Promise<number> {
  const items = await getAll<Task>(KEYS.tasks);
  const remaining = items.filter((t) => !t.isDone);
  await saveAll(KEYS.tasks, remaining);
  return items.length - remaining.length;
}

/** Returns the removed alerts so the caller can cancel their live notifications. */
export async function clearCompletedAlerts(): Promise<Alert[]> {
  const items = await getAll<Alert>(KEYS.alerts);
  const completed = items.filter((a) => a.isCompleted);
  const remaining = items.filter((a) => !a.isCompleted);
  await saveAll(KEYS.alerts, remaining);
  return completed;
}

// --- Events (Widget 1) ---
export async function getEvents(): Promise<Event[]> {
  const items = await getAll<Event>(KEYS.events);
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** True if this event's anchor date recurs on the given day, per its recurrence rule. */
function eventMatchesDate(event: Event, target: Date): boolean {
  const anchor = new Date(event.date + 'T00:00:00');
  switch (event.recurrence) {
    case 'daily':
      return true;
    case 'weekly':
      return anchor.getDay() === target.getDay();
    case 'monthly':
      return anchor.getDate() === target.getDate();
    case 'yearly':
      return anchor.getMonth() === target.getMonth() && anchor.getDate() === target.getDate();
    default:
      return event.date === target.toISOString().slice(0, 10);
  }
}

/** The next date (from `from`) this event actually happens on, given its recurrence. */
function nextOccurrence(event: Event, from: Date): Date {
  const anchor = new Date(event.date + 'T00:00:00');
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  switch (event.recurrence) {
    case 'daily':
      return f;
    case 'weekly': {
      const diff = (anchor.getDay() - f.getDay() + 7) % 7;
      const d = new Date(f);
      d.setDate(f.getDate() + diff);
      return d;
    }
    case 'monthly': {
      let d = new Date(f.getFullYear(), f.getMonth(), anchor.getDate());
      if (d < f) d = new Date(f.getFullYear(), f.getMonth() + 1, anchor.getDate());
      return d;
    }
    case 'yearly': {
      let d = new Date(f.getFullYear(), anchor.getMonth(), anchor.getDate());
      if (d < f) d = new Date(f.getFullYear() + 1, anchor.getMonth(), anchor.getDate());
      return d;
    }
    default:
      return anchor;
  }
}

/** Sorts events by their next upcoming occurrence, so "this July" comes before "next January". */
export function sortEventsByUpcoming(events: Event[]): Event[] {
  const today = new Date();
  return [...events].sort(
    (a, b) => nextOccurrence(a, today).getTime() - nextOccurrence(b, today).getTime()
  );
}

export async function getEventsForToday(): Promise<Event[]> {
  const items = await getEvents();
  const today = new Date();
  return items.filter((e) => eventMatchesDate(e, today));
}

export async function addEvent(event: Omit<Event, 'id'>): Promise<Event> {
  const items = await getAll<Event>(KEYS.events);
  const newEvent: Event = { ...event, id: newId() };
  items.push(newEvent);
  await saveAll(KEYS.events, items);
  return newEvent;
}

export async function updateEvent(id: string, updates: Omit<Event, 'id'>): Promise<void> {
  const items = await getAll<Event>(KEYS.events);
  const idx = items.findIndex((e) => e.id === id);
  if (idx !== -1) items[idx] = { ...updates, id };
  await saveAll(KEYS.events, items);
}

export async function deleteEvent(id: string): Promise<void> {
  const items = await getAll<Event>(KEYS.events);
  await saveAll(KEYS.events, items.filter((e) => e.id !== id));
}

// --- Quote categories (Widget 2) ---
export async function getQuoteCategories(): Promise<QuoteCategory[]> {
  const items = await getAll<QuoteCategory>(KEYS.quoteCategories);
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addQuoteCategory(name: string): Promise<QuoteCategory> {
  const items = await getAll<QuoteCategory>(KEYS.quoteCategories);
  const category: QuoteCategory = { id: newId(), name };
  items.push(category);
  await saveAll(KEYS.quoteCategories, items);
  return category;
}

export async function updateQuoteCategory(id: string, name: string): Promise<void> {
  const items = await getAll<QuoteCategory>(KEYS.quoteCategories);
  const category = items.find((c) => c.id === id);
  if (category) category.name = name;
  await saveAll(KEYS.quoteCategories, items);
}

export async function deleteQuoteCategory(id: string): Promise<void> {
  const items = await getAll<QuoteCategory>(KEYS.quoteCategories);
  await saveAll(KEYS.quoteCategories, items.filter((c) => c.id !== id));

  // Quotes that used this category fall back to Uncategorized rather than being deleted.
  const quotes = await getAll<Quote>(KEYS.quotes);
  let changed = false;
  for (const q of quotes) {
    if (q.categoryId === id) {
      q.categoryId = null;
      changed = true;
    }
  }
  if (changed) await saveAll(KEYS.quotes, quotes);
}

// --- Quotes (Widget 2) ---
export async function getQuotes(): Promise<Quote[]> {
  return getAll<Quote>(KEYS.quotes);
}

/** Quotes grouped into sections by category name, alphabetical; uncategorized last. */
export async function getQuotesGroupedByCategory(): Promise<{ title: string; data: Quote[] }[]> {
  const [quotes, categories] = await Promise.all([getQuotes(), getQuoteCategories()]);
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? null;

  const groups = new Map<string, Quote[]>();
  for (const q of quotes) {
    const name = categoryName(q.categoryId) ?? 'Uncategorized';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(q);
  }

  const sortedNames = [...groups.keys()].sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return sortedNames.map((title) => ({ title, data: groups.get(title)! }));
}

export async function addQuote(quote: Omit<Quote, 'id'>): Promise<Quote> {
  const items = await getAll<Quote>(KEYS.quotes);
  const newQuote: Quote = { ...quote, id: newId() };
  items.push(newQuote);
  await saveAll(KEYS.quotes, items);
  return newQuote;
}

export async function updateQuote(id: string, updates: Omit<Quote, 'id'>): Promise<void> {
  const items = await getAll<Quote>(KEYS.quotes);
  const idx = items.findIndex((q) => q.id === id);
  if (idx !== -1) items[idx] = { ...updates, id };
  await saveAll(KEYS.quotes, items);
}

export async function deleteQuote(id: string): Promise<void> {
  const items = await getAll<Quote>(KEYS.quotes);
  await saveAll(KEYS.quotes, items.filter((q) => q.id !== id));
  const stored = await AsyncStorage.getItem(KEYS.quoteOfDay);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.quoteId === id) await AsyncStorage.removeItem(KEYS.quoteOfDay);
    } catch {
      // Corrupted cache entry - harmless, just clear it so it gets rebuilt.
      await AsyncStorage.removeItem(KEYS.quoteOfDay);
    }
  }
}

export async function getQuoteOfTheDay(): Promise<Quote | null> {
  const quotes = await getQuotes();
  if (quotes.length === 0) return null;

  const stored = await AsyncStorage.getItem(KEYS.quoteOfDay);
  const today = todayStr();

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { date: string; quoteId: string };
      if (parsed.date === today) {
        const match = quotes.find((q) => q.id === parsed.quoteId);
        if (match) return match;
      }
    } catch {
      // Corrupted cache entry - fall through to picking a fresh quote below.
    }
  }

  const picked = quotes[Math.floor(Math.random() * quotes.length)];
  await AsyncStorage.setItem(KEYS.quoteOfDay, JSON.stringify({ date: today, quoteId: picked.id }));
  return picked;
}

// --- Tasks (Widget 3) ---
export async function getTasks(): Promise<Task[]> {
  const items = await getAll<Task>(KEYS.tasks);
  // Due date ascending, no-due-date last; same-day ties broken by priority (1 = most urgent first).
  return items.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return a.priority - b.priority;
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return a.priority - b.priority;
  });
}

export async function addTask(task: Omit<Task, 'id' | 'isDone' | 'createdAt'>): Promise<Task> {
  const items = await getAll<Task>(KEYS.tasks);
  const newTask: Task = { ...task, id: newId(), isDone: false, createdAt: new Date().toISOString() };
  items.push(newTask);
  await saveAll(KEYS.tasks, items);
  return newTask;
}

export async function updateTask(
  id: string,
  updates: Omit<Task, 'id' | 'isDone' | 'createdAt'>
): Promise<void> {
  const items = await getAll<Task>(KEYS.tasks);
  const idx = items.findIndex((t) => t.id === id);
  if (idx !== -1) items[idx] = { ...items[idx], ...updates };
  await saveAll(KEYS.tasks, items);
}

export async function toggleTaskDone(id: string): Promise<void> {
  const items = await getAll<Task>(KEYS.tasks);
  const task = items.find((t) => t.id === id);
  if (task) task.isDone = !task.isDone;
  await saveAll(KEYS.tasks, items);
}

export async function deleteTask(id: string): Promise<void> {
  const items = await getAll<Task>(KEYS.tasks);
  await saveAll(KEYS.tasks, items.filter((t) => t.id !== id));
}

// --- Daily reset + Habit Report ---
// Whichever screen (Home or Habit Base) loads first each day archives
// yesterday's slider/check values into the log, then zeroes them out so
// the day starts fresh. Safe to call every time a screen loads - it's a
// no-op once it's already run today.
export async function checkAndRunDailyHabitReset(): Promise<void> {
  const today = todayStr();
  const lastReset = await AsyncStorage.getItem(KEYS.lastHabitResetDate);
  if (lastReset === today) return;

  if (lastReset) {
    const sliders = await getAll<HabitSlider>(KEYS.habitSliders);
    const checks = await getAll<HabitCheck>(KEYS.habitChecks);

    if (sliders.length > 0) {
      const sliderLogs = await getAll<SliderLogEntry>(KEYS.habitSliderLogs);
      for (const s of sliders) {
        sliderLogs.push({ id: newId(), date: lastReset, name: s.name, unit: s.unit, value: s.value, maxValue: s.maxValue });
      }
      await saveAll(KEYS.habitSliderLogs, sliderLogs);
      for (const s of sliders) s.value = 0;
      await saveAll(KEYS.habitSliders, sliders);
    }

    if (checks.length > 0) {
      const checkLogs = await getAll<CheckLogEntry>(KEYS.habitCheckLogs);
      for (const c of checks) {
        checkLogs.push({ id: newId(), date: lastReset, name: c.name, isChecked: c.isChecked });
      }
      await saveAll(KEYS.habitCheckLogs, checkLogs);
      for (const c of checks) c.isChecked = false;
      await saveAll(KEYS.habitChecks, checks);
    }
  }

  await AsyncStorage.setItem(KEYS.lastHabitResetDate, today);
}

export interface HabitReportDay {
  date: string;
  sliders: SliderLogEntry[];
  checks: CheckLogEntry[];
}

/** Past days' habit snapshots, most recent first. */
export async function getHabitReport(): Promise<HabitReportDay[]> {
  const [sliderLogs, checkLogs] = await Promise.all([
    getAll<SliderLogEntry>(KEYS.habitSliderLogs),
    getAll<CheckLogEntry>(KEYS.habitCheckLogs),
  ]);

  const dates = new Set<string>([...sliderLogs.map((l) => l.date), ...checkLogs.map((l) => l.date)]);
  const days: HabitReportDay[] = [...dates].map((date) => ({
    date,
    sliders: sliderLogs.filter((l) => l.date === date),
    checks: checkLogs.filter((l) => l.date === date),
  }));

  return days.sort((a, b) => b.date.localeCompare(a.date));
}

// --- Habit sliders (Widget 4 - "Progress") ---
export async function getHabitSliders(): Promise<HabitSlider[]> {
  const items = await getAll<HabitSlider>(KEYS.habitSliders);
  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function addHabitSlider(name: string, unit: HabitUnit, maxValue: number): Promise<HabitSlider> {
  const items = await getAll<HabitSlider>(KEYS.habitSliders);
  const slider: HabitSlider = { id: newId(), name, unit, maxValue, value: 0, sortOrder: items.length };
  items.push(slider);
  await saveAll(KEYS.habitSliders, items);
  return slider;
}

export async function updateHabitSliderConfig(
  id: string,
  updates: { name: string; unit: HabitUnit; maxValue: number }
): Promise<void> {
  const items = await getAll<HabitSlider>(KEYS.habitSliders);
  const slider = items.find((s) => s.id === id);
  if (slider) {
    slider.name = updates.name;
    slider.unit = updates.unit;
    slider.maxValue = updates.maxValue;
    if (slider.value > updates.maxValue) slider.value = updates.maxValue;
  }
  await saveAll(KEYS.habitSliders, items);
}

export async function updateHabitSliderValue(id: string, value: number): Promise<void> {
  const items = await getAll<HabitSlider>(KEYS.habitSliders);
  const slider = items.find((s) => s.id === id);
  if (slider) slider.value = value;
  await saveAll(KEYS.habitSliders, items);
}

export async function deleteHabitSlider(id: string): Promise<void> {
  const items = await getAll<HabitSlider>(KEYS.habitSliders);
  await saveAll(KEYS.habitSliders, items.filter((s) => s.id !== id));
}

// --- Habit checks (Widget 4 - "Tracking") ---
export async function getHabitChecks(): Promise<HabitCheck[]> {
  const items = await getAll<HabitCheck>(KEYS.habitChecks);
  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function addHabitCheck(name: string): Promise<HabitCheck> {
  const items = await getAll<HabitCheck>(KEYS.habitChecks);
  const check: HabitCheck = { id: newId(), name, isChecked: false, sortOrder: items.length };
  items.push(check);
  await saveAll(KEYS.habitChecks, items);
  return check;
}

export async function updateHabitCheckName(id: string, name: string): Promise<void> {
  const items = await getAll<HabitCheck>(KEYS.habitChecks);
  const check = items.find((c) => c.id === id);
  if (check) check.name = name;
  await saveAll(KEYS.habitChecks, items);
}

export async function setHabitCheckValue(id: string, isChecked: boolean): Promise<void> {
  const items = await getAll<HabitCheck>(KEYS.habitChecks);
  const check = items.find((c) => c.id === id);
  if (check) check.isChecked = isChecked;
  await saveAll(KEYS.habitChecks, items);
}

export async function deleteHabitCheck(id: string): Promise<void> {
  const items = await getAll<HabitCheck>(KEYS.habitChecks);
  await saveAll(KEYS.habitChecks, items.filter((c) => c.id !== id));
}

// --- Alerts (Widget 5) ---
export async function getAlerts(): Promise<Alert[]> {
  const items = await getAll<Alert>(KEYS.alerts);
  return items.sort((a, b) => {
    const aKey = a.date + (a.time ?? '00:00');
    const bKey = b.date + (b.time ?? '00:00');
    return aKey.localeCompare(bKey);
  });
}

export async function addAlert(alert: Omit<Alert, 'id' | 'isCompleted' | 'createdAt' | 'notificationId'>): Promise<Alert> {
  const items = await getAll<Alert>(KEYS.alerts);
  const newAlert: Alert = {
    ...alert,
    id: newId(),
    isCompleted: false,
    notificationId: null,
    createdAt: new Date().toISOString(),
  };
  items.push(newAlert);
  await saveAll(KEYS.alerts, items);
  return newAlert;
}

export async function updateAlert(
  id: string,
  updates: Omit<Alert, 'id' | 'isCompleted' | 'createdAt' | 'notificationId'>
): Promise<void> {
  const items = await getAll<Alert>(KEYS.alerts);
  const idx = items.findIndex((a) => a.id === id);
  if (idx !== -1) items[idx] = { ...items[idx], ...updates };
  await saveAll(KEYS.alerts, items);
}

export async function setAlertNotificationId(id: string, notificationId: string | null): Promise<void> {
  const items = await getAll<Alert>(KEYS.alerts);
  const alert = items.find((a) => a.id === id);
  if (alert) alert.notificationId = notificationId;
  await saveAll(KEYS.alerts, items);
}

export async function toggleAlertComplete(id: string): Promise<void> {
  const items = await getAll<Alert>(KEYS.alerts);
  const alert = items.find((a) => a.id === id);
  if (alert) alert.isCompleted = !alert.isCompleted;
  await saveAll(KEYS.alerts, items);
}

export async function deleteAlert(id: string): Promise<void> {
  const items = await getAll<Alert>(KEYS.alerts);
  await saveAll(KEYS.alerts, items.filter((a) => a.id !== id));
}

// --- Settings ---
export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Home Base: corrupted settings, using defaults instead of crashing.', err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...updates };
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
  return next;
}

// --- Thoughts (Widget 6) ---
export async function getThoughts(): Promise<Thought[]> {
  const items = await getAll<Thought>(KEYS.thoughts);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addThought(title: string, body: string): Promise<Thought> {
  const items = await getAll<Thought>(KEYS.thoughts);
  const thought: Thought = { id: newId(), title, body, createdAt: new Date().toISOString() };
  items.push(thought);
  await saveAll(KEYS.thoughts, items);
  return thought;
}

export async function updateThought(id: string, title: string, body: string): Promise<void> {
  const items = await getAll<Thought>(KEYS.thoughts);
  const thought = items.find((t) => t.id === id);
  if (thought) {
    thought.title = title;
    thought.body = body;
  }
  await saveAll(KEYS.thoughts, items);
}

export async function deleteThought(id: string): Promise<void> {
  const items = await getAll<Thought>(KEYS.thoughts);
  await saveAll(KEYS.thoughts, items.filter((t) => t.id !== id));
}
