// lib/notifications.ts
//
// Thin wrapper around expo-notifications. Local notifications only -
// no push server needed for a personal app. Delivers even when the app
// is backgrounded or fully closed, as long as the phone itself is on.
//
// Recurring alerts use Expo's calendar-accurate DAILY/WEEKLY/MONTHLY/
// YEARLY trigger types (fires on the actual matching date/weekday each
// time) rather than a fixed-seconds repeat interval, which would drift
// from the real calendar date over time.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert as AlertModel } from '../types/models';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

/** True if notifications are currently allowed - never prompts. */
export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Asks for permission only if we haven't already asked (or the person
 * can still be asked again). If they already said no, this returns
 * false without re-prompting - iOS won't show the system dialog twice,
 * so the caller should point them to Settings instead.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (current.status === 'denied' && current.canAskAgain === false) return false;

  const requested = await requestNotificationPermission();
  return requested;
}

/**
 * Schedules a local notification for an Alert, `notificationOffsetMinutes`
 * before its date/time, repeating according to the alert's recurrence.
 * Returns null (and schedules nothing) if the alert is all-day, has no
 * time, has no offset set, or - for a one-time alert - the computed fire
 * time is already in the past.
 */
export async function scheduleAlertNotification(alert: AlertModel): Promise<string | null> {
  if (alert.isAllDay || !alert.time || alert.notificationOffsetMinutes == null) {
    return null;
  }

  const [hours, minutes] = alert.time.split(':').map(Number);
  const anchor = new Date(alert.date + 'T00:00:00');
  anchor.setHours(hours, minutes, 0, 0);
  anchor.setMinutes(anchor.getMinutes() - alert.notificationOffsetMinutes);

  const content = {
    title: alert.name,
    body: alert.notes || `In ${alert.notificationOffsetMinutes} minutes`,
  };

  switch (alert.recurrence) {
    case 'daily':
      return Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: anchor.getHours(),
          minute: anchor.getMinutes(),
        },
      });

    case 'weekly':
      return Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: anchor.getDay() + 1, // Expo uses 1-7 (Sunday=1); JS getDay() is 0-6
          hour: anchor.getHours(),
          minute: anchor.getMinutes(),
        },
      });

    case 'monthly':
      return Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: anchor.getDate(),
          hour: anchor.getHours(),
          minute: anchor.getMinutes(),
        },
      });

    case 'yearly':
      return Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
          day: anchor.getDate(),
          month: anchor.getMonth(), // zero-indexed, matching JS Date
          hour: anchor.getHours(),
          minute: anchor.getMinutes(),
        },
      });

    default: {
      if (anchor.getTime() <= Date.now()) return null;
      return Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: anchor },
      });
    }
  }
}

export async function cancelAlertNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
