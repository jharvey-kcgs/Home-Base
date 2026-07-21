// screens/QuickCaptureScreen.tsx
//
// The whole point of this app: capture something in under 5 seconds.
// One text field, one type selector, optional date if it's a reminder.
// Everything else can be refined later - it should never block the save.

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addEntry, addReminder, addLog, addList, setReminderNotificationId } from '../lib/storage';
import { scheduleReminderNotification } from '../lib/notifications';
import { RecurrenceRule, RECURRENCE_LABELS } from '../types/models';

type CaptureType = 'entry' | 'reminder' | 'log' | 'list';

const TYPE_LABELS: Record<CaptureType, string> = {
  entry: 'Note',
  reminder: 'Reminder',
  log: 'Log',
  list: 'List',
};

const PLACEHOLDERS: Record<CaptureType, string> = {
  entry: "What's the idea?",
  reminder: 'What do you need to remember?',
  log: 'What are you logging? (e.g. Lunch: chicken salad)',
  list: 'List name',
};

export default function QuickCaptureScreen({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<CaptureType>('entry');
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const save = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    switch (type) {
      case 'entry':
        await addEntry(trimmed, 'idea');
        break;
      case 'reminder': {
        const reminder = await addReminder(trimmed, dueDate.toISOString(), recurrence);
        const notificationId = await scheduleReminderNotification(reminder);
        await setReminderNotificationId(reminder.id, notificationId);
        break;
      }
      case 'log': {
        const parts = trimmed.split(':');
        if (parts.length > 1) {
          await addLog(parts[0].trim(), parts.slice(1).join(':').trim());
        } else {
          await addLog('general', trimmed);
        }
        break;
      }
      case 'list':
        await addList(trimmed);
        break;
    }
    onClose();
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Capture</Text>
          <TouchableOpacity onPress={save} disabled={!text.trim()}>
            <Text style={[styles.headerButton, styles.saveButton, !text.trim() && styles.disabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.typeSelector}>
          {(Object.keys(TYPE_LABELS) as CaptureType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                {TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={PLACEHOLDERS[type]}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
        />

        {type === 'reminder' && (
          <View style={styles.reminderOptions}>
            <TouchableOpacity style={styles.optionRow} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.optionLabel}>Due</Text>
              <Text style={styles.optionValue}>{dueDate.toLocaleString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="datetime"
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setDueDate(selected);
                }}
              />
            )}
            <View style={styles.recurrenceRow}>
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceRule[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.recurrenceChip, recurrence === r && styles.typeChipActive]}
                  onPress={() => setRecurrence(r)}
                >
                  <Text style={[styles.typeChipText, recurrence === r && styles.typeChipTextActive]}>
                    {RECURRENCE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 60 : 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: { fontSize: 16, color: '#007AFF' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveButton: { fontWeight: '600' },
  disabled: { opacity: 0.3 },
  typeSelector: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
  },
  typeChipActive: { backgroundColor: '#007AFF' },
  typeChipText: { fontSize: 14, color: '#000' },
  typeChipTextActive: { color: '#fff' },
  input: {
    marginHorizontal: 16,
    fontSize: 18,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reminderOptions: { marginTop: 16, paddingHorizontal: 16 },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  optionLabel: { fontSize: 16 },
  optionValue: { fontSize: 16, color: '#8e8e93' },
  recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  recurrenceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f2f2f7',
  },
});
