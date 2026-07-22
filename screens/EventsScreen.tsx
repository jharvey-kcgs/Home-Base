// screens/EventsScreen.tsx

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  sortEventsByUpcoming,
  getAlerts,
  addAlert,
  updateAlert,
  deleteAlert,
  setAlertNotificationId,
  getSettings,
} from '../lib/storage';
import { scheduleAlertNotification, cancelAlertNotification, ensureNotificationPermission, getAlertScheduleWarning } from '../lib/notifications';
import {
  Event,
  RecurrenceRule,
  RECURRENCE_LABELS,
  NotificationOffset,
  NOTIFICATION_OFFSETS,
  Alert as AlertModel,
} from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

function defaultReminderTime(): Date {
  const t = new Date();
  t.setHours(9, 0, 0, 0);
  return t;
}

export default function EventsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [events, setEvents] = useState<Event[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none');

  // Companion reminder (creates/updates a linked Alert)
  const [linkedAlertId, setLinkedAlertId] = useState<string | null>(null);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(defaultReminderTime());
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [reminderOffset, setReminderOffset] = useState<NotificationOffset | null>(5);

  const load = useCallback(async () => {
    const all = await getEvents();
    setEvents(sortEventsByUpcoming(all));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openNew = () => {
    setEditingId(null);
    setDate(new Date());
    setName('');
    setDescription('');
    setRecurrence('none');
    setLinkedAlertId(null);
    setHasReminder(false);
    setReminderTime(defaultReminderTime());
    setReminderOffset(5);
    setShowEditor(true);
  };

  const openExisting = async (event: Event) => {
    setEditingId(event.id);
    setDate(new Date(event.date + 'T00:00:00'));
    setName(event.name);
    setDescription(event.description);
    setRecurrence(event.recurrence);
    setLinkedAlertId(event.linkedAlertId);

    if (event.linkedAlertId) {
      const allAlerts = await getAlerts();
      const linked = allAlerts.find((a) => a.id === event.linkedAlertId);
      if (linked && linked.time) {
        setHasReminder(true);
        const [h, m] = linked.time.split(':').map(Number);
        const t = new Date();
        t.setHours(h, m, 0, 0);
        setReminderTime(t);
        setReminderOffset(linked.notificationOffsetMinutes);
      } else {
        setHasReminder(false);
        setReminderTime(defaultReminderTime());
        setReminderOffset(5);
      }
    } else {
      setHasReminder(false);
      setReminderTime(defaultReminderTime());
      setReminderOffset(5);
    }

    setShowEditor(true);
  };

  const handleMenu = () => {
    Alert.alert('Event Base', undefined, [
      { text: 'New Event', onPress: openNew },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  /** Creates, updates, or removes the companion Alert to match the reminder toggle. Returns the linkedAlertId to save on the Event. */
  const syncReminder = async (eventDate: string, eventName: string): Promise<string | null> => {
    if (!hasReminder) {
      if (linkedAlertId) {
        const allAlerts = await getAlerts();
        const existing = allAlerts.find((a) => a.id === linkedAlertId);
        if (existing?.notificationId) await cancelAlertNotification(existing.notificationId);
        await deleteAlert(linkedAlertId);
      }
      return null;
    }

    const timeStr = `${String(reminderTime.getHours()).padStart(2, '0')}:${String(
      reminderTime.getMinutes()
    ).padStart(2, '0')}`;

    const alertPayload = {
      name: eventName,
      isAllDay: false,
      date: eventDate,
      time: timeStr,
      notes: '',
      notificationOffsetMinutes: reminderOffset,
      recurrence,
    };

    let alertId = linkedAlertId;
    let previousNotificationId: string | null = null;

    if (linkedAlertId) {
      const allAlerts = await getAlerts();
      previousNotificationId = allAlerts.find((a) => a.id === linkedAlertId)?.notificationId ?? null;
      await updateAlert(linkedAlertId, alertPayload);
    } else {
      const created = await addAlert(alertPayload);
      alertId = created.id;
    }

    if (alertId) {
      if (previousNotificationId) await cancelAlertNotification(previousNotificationId);

      const scheduleWarning = getAlertScheduleWarning({ ...alertPayload, id: alertId } as AlertModel);
      if (scheduleWarning) {
        await setAlertNotificationId(alertId, null);
        Alert.alert("This reminder won't notify you", scheduleWarning);
        return alertId;
      }

      const granted = await ensureNotificationPermission();
      if (!granted) {
        await setAlertNotificationId(alertId, null);
        Alert.alert(
          'Notifications are off',
          "This reminder was saved, but you won't be notified until notifications are turned back on.",
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => navigation.navigate('NotificationSettings') },
          ]
        );
        return alertId;
      }

      const settings = await getSettings();
      const inVacation =
        settings.vacationStart &&
        settings.vacationEnd &&
        eventDate >= settings.vacationStart &&
        eventDate <= settings.vacationEnd;
      const notificationId =
        settings.notificationsEnabled && !inVacation
          ? await scheduleAlertNotification({ ...alertPayload, id: alertId } as AlertModel)
          : null;
      await setAlertNotificationId(alertId, notificationId);
    }

    return alertId;
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const eventDate = date.toISOString().slice(0, 10);

    const finalLinkedAlertId = await syncReminder(eventDate, trimmed);

    const payload = {
      date: eventDate,
      name: trimmed,
      description,
      recurrence,
      linkedAlertId: finalLinkedAlertId,
    };

    if (editingId) {
      await updateEvent(editingId, payload);
    } else {
      await addEvent(payload);
    }
    setShowEditor(false);
    load();
  };

  const handleDeleteMenu = () => {
    Alert.alert('Delete this event?', undefined, [
      {
        text: 'Delete Event',
        style: 'destructive',
        onPress: async () => {
          if (editingId) {
            if (linkedAlertId) {
              const allAlerts = await getAlerts();
              const existing = allAlerts.find((a) => a.id === linkedAlertId);
              if (existing?.notificationId) await cancelAlertNotification(existing.notificationId);
              await deleteAlert(linkedAlertId);
            }
            await deleteEvent(editingId);
            setShowEditor(false);
            load();
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.back}>‹ Home Base</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          Event Base
        </Text>
        <TouchableOpacity onPress={handleMenu} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.menuDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>Events</Text>

      <FlatList
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openExisting(item)}>
            <Text style={styles.rowDate}>{item.date}</Text>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <View style={styles.rowMeta}>
              {item.recurrence !== 'none' && (
                <Text style={styles.rowRecurrence}>{RECURRENCE_LABELS[item.recurrence]}</Text>
              )}
              {item.linkedAlertId && <Text style={styles.rowReminder}>🔔 Reminder set</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Tap ••• to add your first event.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.back}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>{editingId ? 'Edit Event' : 'New Event'}</Text>
            <View style={styles.editorActions}>
              {editingId && (
                <TouchableOpacity onPress={handleDeleteMenu} style={{ marginRight: 16 }}>
                  <Text style={styles.menuDots}>•••</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={[styles.form, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
                value={date}
                mode="date"
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setDate(selected);
                }}
              />
            )}

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              placeholder="Event name"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.descriptionInput]}
              placeholder="Details..."
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={styles.fieldLabel}>Repeats</Text>
            <View style={styles.recurrenceRow}>
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceRule[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.recurrenceChip, recurrence === r && styles.recurrenceChipActive]}
                  onPress={() => setRecurrence(r)}
                >
                  <Text
                    style={[styles.recurrenceChipText, recurrence === r && styles.recurrenceChipTextActive]}
                  >
                    {RECURRENCE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.reminderToggleRow}>
              <Text style={styles.fieldLabel}>Also set a reminder</Text>
              <Switch value={hasReminder} onValueChange={setHasReminder} trackColor={{ true: theme.colors.accent }} />
            </View>

            {hasReminder && (
              <>
                <Text style={styles.note}>
                  Creates a linked alert in Alert Base{recurrence !== 'none' ? ` that repeats ${RECURRENCE_LABELS[recurrence].toLowerCase()}, matching this event` : ' for this event'}.
                </Text>

                <Text style={styles.fieldLabel}>Reminder Time</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowReminderTimePicker(true)}>
                  <Text>{reminderTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                </TouchableOpacity>
                {showReminderTimePicker && (
                  <DateTimePicker
                    themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
                    value={reminderTime}
                    mode="time"
                    onChange={(_, selected) => {
                      setShowReminderTimePicker(Platform.OS === 'ios');
                      if (selected) setReminderTime(selected);
                    }}
                  />
                )}

                <Text style={styles.fieldLabel}>Notify</Text>
                <View style={styles.recurrenceRow}>
                  {NOTIFICATION_OFFSETS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.recurrenceChip, reminderOffset === m && styles.recurrenceChipActive]}
                      onPress={() => setReminderOffset(m)}
                    >
                      <Text
                        style={[
                          styles.recurrenceChipText,
                          reminderOffset === m && styles.recurrenceChipTextActive,
                        ]}
                      >
                        {m === 0 ? 'At the time' : `${m} min before`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  back: { color: c.accentReadable, fontSize: 16, fontFamily: REGULAR },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  headerSide: { minWidth: 50, flexShrink: 0 },
  menuDots: { fontSize: 18, color: c.accentReadable, letterSpacing: 1 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: REGULAR,
    color: c.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  row: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  rowDate: { fontSize: 12, color: c.textSecondary, fontFamily: REGULAR },
  rowTitle: { fontSize: 17, marginTop: 2, fontFamily: REGULAR },
  rowMeta: { flexDirection: 'row', gap: 10, marginTop: 2 },
  rowRecurrence: { fontSize: 13, color: c.accentReadable, fontFamily: REGULAR },
  rowReminder: { fontSize: 13, color: c.textSecondary, fontFamily: REGULAR },
  empty: { padding: 20, textAlign: 'center', color: c.textMuted, fontFamily: REGULAR },
  editorContainer: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'ios' ? 60 : 24 },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  editorTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700' },
  editorActions: { flexDirection: 'row', alignItems: 'center' },
  saveButton: { color: c.accentReadable, fontSize: 16, fontFamily: REGULAR },
  form: { paddingHorizontal: 16, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: c.textMuted, marginTop: 16, marginBottom: 6, fontFamily: REGULAR },
  dateButton: { padding: 10, borderWidth: 1, borderColor: c.border, borderRadius: 8, alignSelf: 'flex-start' },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, fontSize: 16, fontFamily: REGULAR, color: c.text },
  descriptionInput: { minHeight: 90, textAlignVertical: 'top' },
  recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrenceChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: c.surface },
  recurrenceChipActive: { backgroundColor: c.accent },
  recurrenceChipText: { fontSize: 14, color: c.text, fontFamily: REGULAR },
  recurrenceChipTextActive: { color: c.accentText },
  reminderToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  note: { fontSize: 12, color: c.textMuted, fontFamily: REGULAR, marginTop: -2, marginBottom: 4 },
});
