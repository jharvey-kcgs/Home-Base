// screens/TasksScreen.tsx

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTasks, addTask, updateTask, toggleTaskDone, deleteTask, clearCompletedTasks } from '../lib/storage';
import { Task, Priority, PRIORITY_LABELS } from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

function formatDueDateHeader(dateStr: string | null): string {
  if (!dateStr) return 'No Due Date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Tasks are already sorted by due date; group consecutive same-date runs into sections. */
function groupTasksByDueDate(tasks: Task[]): { title: string; data: Task[] }[] {
  const sections: { title: string; data: Task[] }[] = [];
  for (const t of tasks) {
    const header = formatDueDateHeader(t.dueDate);
    const last = sections[sections.length - 1];
    if (last && last.title === header) {
      last.data.push(t);
    } else {
      sections.push({ title: header, data: [t] });
    }
  }
  return sections;
}

export default function TasksScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [tasks, setTasks] = useState<Task[]>([]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Priority>(3);
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setTasks(await getTasks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openNew = () => {
    setEditingId(null);
    setName('');
    setPriority(3);
    setDueDate(new Date());
    setNotes('');
    setShowEditor(true);
  };

  const openExisting = (task: Task) => {
    setEditingId(task.id);
    setName(task.name);
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null);
    setNotes(task.notes);
    setShowEditor(true);
  };

  const handleMenu = () => {
    Alert.alert('Task Base', undefined, [
      { text: 'Add Task', onPress: openNew },
      { text: 'Clear Completed', onPress: handleClearCompleted },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleClearCompleted = () => {
    const doneCount = tasks.filter((t) => t.isDone).length;
    if (doneCount === 0) {
      Alert.alert('Nothing to clear', 'No completed tasks yet.');
      return;
    }
    Alert.alert(`Clear ${doneCount} completed task${doneCount > 1 ? 's' : ''}?`, undefined, [
      {
        text: 'Clear Completed',
        style: 'destructive',
        onPress: async () => {
          await clearCompletedTasks();
          load();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload = {
      name: trimmed,
      priority,
      dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
      notes,
    };
    if (editingId) {
      await updateTask(editingId, payload);
    } else {
      await addTask(payload);
    }
    setShowEditor(false);
    load();
  };

  const handleDeleteMenu = () => {
    Alert.alert('Delete this task?', undefined, [
      {
        text: 'Delete Task',
        style: 'destructive',
        onPress: async () => {
          if (editingId) {
            await deleteTask(editingId);
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
          Task Base
        </Text>
        <TouchableOpacity onPress={handleMenu} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.menuDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        sections={groupTasksByDueDate(tasks)}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity onPress={() => toggleTaskDone(item.id).then(load)}>
              <Text style={styles.checkbox}>{item.isDone ? '☑' : '☐'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rowMain} onPress={() => openExisting(item)}>
              <Text style={[styles.rowTitle, item.isDone && styles.doneText]}>{item.name}</Text>
              <View style={styles.rowMeta}>
                <Text style={styles.priorityBadge}>{PRIORITY_LABELS[item.priority]}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Tap ••• to add your first task.</Text>}
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
            <Text style={styles.editorTitle}>{editingId ? 'Edit Task' : 'New Task'}</Text>
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
            <Text style={styles.fieldLabel}>Task Name</Text>
            <TextInput placeholderTextColor={theme.colors.textMuted} style={styles.input} placeholder="What needs doing?" value={name} onChangeText={setName} />

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4] as Priority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, priority === p && styles.chipActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                    {p} · {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Due Date</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={{ fontFamily: REGULAR }}>
                  {dueDate ? dueDate.toLocaleDateString() : 'No due date'}
                </Text>
              </TouchableOpacity>
              {dueDate && (
                <TouchableOpacity style={styles.chip} onPress={() => setDueDate(null)}>
                  <Text style={styles.chipText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate ?? new Date()}
                mode="date"
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setDueDate(selected);
                }}
              />
            )}

            <Text style={styles.fieldLabel}>Notes</Text>
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
  sectionHeader: {
    fontSize: 13,
    fontFamily: REGULAR,
    color: c.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: c.background,
  },
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
  rowMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  priorityBadge: { fontSize: 12, color: c.accent, fontFamily: REGULAR },
  dueDate: { fontSize: 12, color: c.textSecondary, fontFamily: REGULAR },
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
  form: { paddingHorizontal: 16 },
  fieldLabel: { fontSize: 13, color: c.textMuted, marginTop: 16, marginBottom: 6, fontFamily: REGULAR },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, fontSize: 16, fontFamily: REGULAR, color: c.text },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: c.surface },
  chipActive: { backgroundColor: c.accent },
  chipText: { fontSize: 14, color: c.text, fontFamily: REGULAR },
  chipTextActive: { color: c.accentText },
  dateButton: { padding: 10, borderWidth: 1, borderColor: c.border, borderRadius: 8 },
});
