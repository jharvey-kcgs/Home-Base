// screens/AlertsScreen.tsx

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert as RNAlert,
  Switch,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAlerts, addAlert, updateAlert, setAlertNotificationId, toggleAlertComplete, deleteAlert, getSettings, clearCompletedAlerts } from '../lib/storage';
import { scheduleAlertNotification, cancelAlertNotification, ensureNotificationPermission, getAlertScheduleWarning } from '../lib/notifications';
import {
  Alert as AlertModel,
  NotificationOffset,
  NOTIFICATION_OFFSETS,
  RecurrenceRule,
  RECURRENCE_LABELS,
} from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

export default function AlertsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [alerts, setAlerts] = useState<AlertModel[]>([]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [notificationOffset, setNotificationOffset] = useState<NotificationOffset>(0);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setAlerts(await getAlerts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openNew = () => {
    setEditingId(null);
    setName('');
    setIsAllDay(false);
    setDate(new Date());
    setTime(new Date());
    setNotes('');
    setNotificationOffset(0);
    setRecurrence('none');
    setShowEditor(true);
  };

  const openExisting = (alert: AlertModel) => {
    setEditingId(alert.id);
    setName(alert.name);
    setIsAllDay(alert.isAllDay);
    setDate(new Date(alert.date + 'T00:00:00'));
    if (alert.time) {
      const [h, m] = alert.time.split(':').map(Number);
      const t = new Date();
      t.setHours(h, m, 0, 0);
      setTime(t);
    } else {
      setTime(new Date());
    }
    setNotes(alert.notes);
    setNotificationOffset(alert.notificationOffsetMinutes ?? 0);
    setRecurrence(alert.recurrence);
    setShowEditor(true);
  };

  const handleMenu = () => {
    RNAlert.alert('Alert Base', undefined, [
      { text: 'Add Alert', onPress: openNew },
      { text: 'Clear Completed', onPress: handleClearCompleted },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleClearCompleted = async () => {
    const completedCount = alerts.filter((a) => a.isCompleted).length;
    if (completedCount === 0) {
      RNAlert.alert('Nothing to clear', 'No completed alerts yet.');
      return;
    }
    RNAlert.alert(`Clear ${completedCount} completed alert${completedCount > 1 ? 's' : ''}?`, undefined, [
      {
        text: 'Clear Completed',
        style: 'destructive',
        onPress: async () => {
          const removed = await clearCompletedAlerts();
          for (const a of removed) {
            if (a.notificationId) await cancelAlertNotification(a.notificationId);
          }
          load();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (isSaving) return; // guards against double-tap creating duplicates
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!isAllDay && !time) return;

    setIsSaving(true);
    try {
      const timeStr = isAllDay
        ? null
        : `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

      const payload = {
        name: trimmed,
        isAllDay,
        date: date.toISOString().slice(0, 10),
        time: timeStr,
        notes,
        notificationOffsetMinutes: isAllDay ? null : notificationOffset,
        recurrence: isAllDay ? 'none' as RecurrenceRule : recurrence,
      };

      const previousNotificationId = editingId ? alerts.find((a) => a.id === editingId)?.notificationId : null;

      let alertId = editingId;
      if (editingId) {
        await updateAlert(editingId, payload);
      } else {
        const created = await addAlert(payload);
        alertId = created.id;
      }

      // Close and refresh right away - don't make the user wait on notification scheduling.
      setShowEditor(false);
      load();

      // Schedule (or reschedule) the notification in the background.
      if (alertId) {
        const id = alertId;
        const wantsNotification = !isAllDay && payload.notificationOffsetMinutes != null;
        (async () => {
          try {
            if (previousNotificationId) await cancelAlertNotification(previousNotificationId);

            if (wantsNotification) {
              const scheduleWarning = getAlertScheduleWarning({ ...payload, id } as AlertModel);
              if (scheduleWarning) {
                await setAlertNotificationId(id, null);
                RNAlert.alert("This alert won't notify you", scheduleWarning);
                return;
              }

              const granted = await ensureNotificationPermission();
              if (!granted) {
                await setAlertNotificationId(id, null);
                RNAlert.alert(
                  'Notifications are off',
                  "This alert was saved, but you won't be notified until notifications are turned back on.",
                  [
                    { text: 'Not Now', style: 'cancel' },
                    { text: 'Go to Settings', onPress: () => navigation.navigate('NotificationSettings') },
                  ]
                );
                return;
              }
            }

            const settings = await getSettings();
            const inVacation =
              settings.vacationStart &&
              settings.vacationEnd &&
              payload.date >= settings.vacationStart &&
              payload.date <= settings.vacationEnd;

            const notificationId =
              settings.notificationsEnabled && !inVacation
                ? await scheduleAlertNotification({ ...payload, id } as AlertModel)
                : null;
            await setAlertNotificationId(id, notificationId);
          } catch (err) {
            console.warn('Failed to schedule alert notification', err);
          }
        })();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenu = () => {
    RNAlert.alert('Delete this alert?', undefined, [
      {
        text: 'Delete Alert',
        style: 'destructive',
        onPress: async () => {
          if (!editingId) return;
          const existing = alerts.find((a) => a.id === editingId);
          if (existing?.notificationId) await cancelAlertNotification(existing.notificationId);
          await deleteAlert(editingId);
          setShowEditor(false);
          load();
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
          Alert Base
        </Text>
        <TouchableOpacity onPress={handleMenu} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.menuDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity onPress={() => toggleAlertComplete(item.id).then(load)}>
              <Text style={styles.checkbox}>{item.isCompleted ? '☑' : '☐'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rowMain} onPress={() => openExisting(item)}>
              <Text style={[styles.rowTitle, item.isCompleted && styles.doneText]}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                {item.date}
                {item.isAllDay ? ' · All Day' : item.time ? ` · ${item.time}` : ''}
                {item.notificationOffsetMinutes != null
                  ? ` · ${item.notificationOffsetMinutes === 0 ? 'Notify at the time' : `${item.notificationOffsetMinutes}min before`}`
                  : ''}
                {item.recurrence !== 'none' ? ` · ${RECURRENCE_LABELS[item.recurrence]}` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Tap ••• to add your first alert.</Text>}
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
            <Text style={styles.editorTitle}>{editingId ? 'Edit Alert' : 'New Alert'}</Text>
            <View style={styles.editorActions}>
              {editingId && (
                <TouchableOpacity onPress={handleDeleteMenu} style={{ marginRight: 16 }}>
                  <Text style={styles.menuDots}>•••</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSave} disabled={!name.trim() || isSaving}>
                <Text style={[styles.saveButton, (!name.trim() || isSaving) && styles.disabled]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={[styles.form, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]} keyboardShouldPersistTaps="handled">
            <TextInput placeholderTextColor={theme.colors.textMuted} style={styles.input} placeholder="What's the alert?" value={name} onChangeText={setName} />

            <View style={styles.allDayRow}>
              <Text style={styles.fieldLabel}>All Day</Text>
              <Switch value={isAllDay} onValueChange={setIsAllDay} trackColor={{ true: theme.colors.accent }} />
            </View>

            <Text style={styles.fieldLabel}>Date (required)</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={{ fontFamily: REGULAR }}>{date.toLocaleDateString()}</Text>
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

            {!isAllDay && (
              <>
                <Text style={styles.fieldLabel}>Time (required)</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={{ fontFamily: REGULAR }}>
                    {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
                    value={time}
                    mode="time"
                    onChange={(_, selected) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selected) setTime(selected);
                    }}
                  />
                )}

                <Text style={styles.fieldLabel}>Notify</Text>
                <View style={styles.chipRow}>
                  {NOTIFICATION_OFFSETS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, notificationOffset === m && styles.chipActive]}
                      onPress={() => setNotificationOffset(m)}
                    >
                      <Text style={[styles.chipText, notificationOffset === m && styles.chipTextActive]}>
                        {m === 0 ? 'At the time' : `${m} min before`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Repeats</Text>
                <View style={styles.chipRow}>
                  {(Object.keys(RECURRENCE_LABELS) as RecurrenceRule[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, recurrence === r && styles.chipActive]}
                      onPress={() => setRecurrence(r)}
                    >
                      <Text style={[styles.chipText, recurrence === r && styles.chipTextActive]}>
                        {RECURRENCE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
            placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.multilineInput]}
              placeholder="Any notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />
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
  back: { color: c.accent, fontSize: 16, fontFamily: REGULAR },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  headerSide: { minWidth: 50, flexShrink: 0 },
  menuDots: { fontSize: 18, color: c.accent, letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  checkbox: { fontSize: 20, marginTop: 2 },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 16, fontFamily: REGULAR },
  doneText: { textDecorationLine: 'line-through', color: c.textMuted },
  rowSubtitle: { fontSize: 12, color: c.textSecondary, marginTop: 2, fontFamily: REGULAR },
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
  saveButton: { color: c.accent, fontSize: 16, fontFamily: REGULAR },
  disabled: { opacity: 0.3 },
  form: { paddingHorizontal: 16 },
  fieldLabel: { fontSize: 13, color: c.textMuted, marginTop: 16, marginBottom: 6, fontFamily: REGULAR },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, fontSize: 16, fontFamily: REGULAR, color: c.text },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  allDayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  dateButton: { padding: 10, borderWidth: 1, borderColor: c.border, borderRadius: 8, alignSelf: 'flex-start' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: c.surface },
  chipActive: { backgroundColor: c.accent },
  chipText: { fontSize: 14, color: c.text, fontFamily: REGULAR },
  chipTextActive: { color: c.accentText },
});
