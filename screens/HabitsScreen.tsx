// screens/HabitsScreen.tsx

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import {
  checkAndRunDailyHabitReset,
  getHabitReport,
  type HabitReportDay,
  getHabitSliders,
  addHabitSlider,
  updateHabitSliderConfig,
  updateHabitSliderValue,
  deleteHabitSlider,
  getHabitChecks,
  addHabitCheck,
  updateHabitCheckName,
  setHabitCheckValue,
  deleteHabitCheck,
} from '../lib/storage';
import { HabitSlider, HabitCheck, HabitUnit, HABIT_UNITS } from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

type EditorKind = 'slider' | 'check';

export default function HabitsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [sliders, setSliders] = useState<HabitSlider[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);

  const [showEditor, setShowEditor] = useState(false);
  const [editorKind, setEditorKind] = useState<EditorKind>('slider');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<HabitUnit>('Minutes');
  const [maxValueText, setMaxValueText] = useState('10');

  const [showReport, setShowReport] = useState(false);
  const [reportDays, setReportDays] = useState<HabitReportDay[]>([]);

  const load = useCallback(async () => {
    await checkAndRunDailyHabitReset();
    setSliders(await getHabitSliders());
    setChecks(await getHabitChecks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSliderChange = (id: string, value: number) => {
    setSliders((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  const handleSliderComplete = async (id: string, value: number) => {
    await updateHabitSliderValue(id, Math.round(value));
  };

  const openNewSlider = () => {
    setEditorKind('slider');
    setEditingId(null);
    setName('');
    setUnit('Minutes');
    setMaxValueText('10');
    setShowEditor(true);
  };

  const openNewCheck = () => {
    setEditorKind('check');
    setEditingId(null);
    setName('');
    setShowEditor(true);
  };

  const openExistingSlider = (s: HabitSlider) => {
    setEditorKind('slider');
    setEditingId(s.id);
    setName(s.name);
    setUnit(s.unit);
    setMaxValueText(String(s.maxValue));
    setShowEditor(true);
  };

  const openExistingCheck = (c: HabitCheck) => {
    setEditorKind('check');
    setEditingId(c.id);
    setName(c.name);
    setShowEditor(true);
  };

  const openReport = async () => {
    setReportDays(await getHabitReport());
    setShowReport(true);
  };

  const handleMenu = () => {
    Alert.alert('Habit Base', undefined, [
      { text: 'Add Progress Habit', onPress: openNewSlider },
      { text: 'Add Tracking Habit', onPress: openNewCheck },
      { text: 'Habit Report', onPress: openReport },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editorKind === 'slider') {
      const max = parseInt(maxValueText, 10);
      if (!max || max <= 0) return;
      if (editingId) {
        await updateHabitSliderConfig(editingId, { name: trimmed, unit, maxValue: max });
      } else {
        await addHabitSlider(trimmed, unit, max);
      }
    } else {
      if (editingId) {
        await updateHabitCheckName(editingId, trimmed);
      } else {
        await addHabitCheck(trimmed);
      }
    }
    setShowEditor(false);
    load();
  };

  const handleDeleteMenu = () => {
    Alert.alert('Delete this habit?', undefined, [
      {
        text: 'Delete Habit',
        style: 'destructive',
        onPress: async () => {
          if (!editingId) return;
          if (editorKind === 'slider') {
            await deleteHabitSlider(editingId);
          } else {
            await deleteHabitCheck(editingId);
          }
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
          Habit Base
        </Text>
        <TouchableOpacity onPress={handleMenu} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.menuDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionHeader}>Progress</Text>
        {sliders.map((s) => (
          <View key={s.id} style={styles.sliderRow}>
            <TouchableOpacity onPress={() => openExistingSlider(s)}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabel}>{s.name}</Text>
                <Text style={styles.sliderValue}>
                  {s.value} / {s.maxValue} {s.unit}
                </Text>
              </View>
            </TouchableOpacity>
            <Slider
              minimumValue={0}
              maximumValue={s.maxValue}
              step={1}
              value={s.value}
              onValueChange={(v) => handleSliderChange(s.id, v)}
              onSlidingComplete={(v) => handleSliderComplete(s.id, v)}
              minimumTrackTintColor={theme.colors.accent}
            />
          </View>
        ))}
        {sliders.length === 0 && <Text style={styles.empty}>No progress habits yet.</Text>}

        <Text style={styles.sectionHeader}>Tracking</Text>
        {checks.map((c) => (
          <View key={c.id} style={styles.row}>
            <TouchableOpacity onPress={() => openExistingCheck(c)}>
              <Text style={styles.rowText}>{c.name}</Text>
            </TouchableOpacity>
            <View style={styles.yesNoRow}>
              <TouchableOpacity
                style={[styles.yesNoButton, c.isChecked && styles.yesNoButtonActiveYes]}
                onPress={() => setHabitCheckValue(c.id, true).then(load)}
              >
                <Text style={[styles.yesNoText, c.isChecked && styles.yesNoTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yesNoButton, !c.isChecked && styles.yesNoButtonActiveNo]}
                onPress={() => setHabitCheckValue(c.id, false).then(load)}
              >
                <Text style={[styles.yesNoText, !c.isChecked && styles.yesNoTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {checks.length === 0 && <Text style={styles.empty}>No tracking habits yet.</Text>}
      </ScrollView>

      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.back}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>
              {editorKind === 'slider'
                ? editingId
                  ? 'Edit Progress Habit'
                  : 'Add Progress Habit'
                : editingId
                ? 'Edit Tracking Habit'
                : 'Add Tracking Habit'}
            </Text>
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
            <Text style={styles.fieldLabel}>Type</Text>
            <Text style={styles.typeReadout}>{editorKind === 'slider' ? 'Progress Habit' : 'Tracking Habit'}</Text>

            <Text style={styles.fieldLabel}>Habit Name</Text>
            <TextInput placeholderTextColor={theme.colors.textMuted} style={styles.input} placeholder="Habit name" value={name} onChangeText={setName} />

            {editorKind === 'slider' && (
              <>
                <Text style={styles.fieldLabel}>Unit</Text>
                <View style={styles.chipRow}>
                  {HABIT_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.chip, unit === u && styles.chipActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Max Amount</Text>
                <TextInput
            placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  placeholder="e.g. 8"
                  value={maxValueText}
                  onChangeText={setMaxValueText}
                  keyboardType="number-pad"
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Habit report */}
      <Modal visible={showReport} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowReport(false)}>
              <Text style={styles.back}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Habit Report</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }} contentContainerStyle={{ paddingBottom: 40 }}>
            {reportDays.length === 0 && (
              <Text style={styles.empty}>No past days yet - check back after today resets.</Text>
            )}
            {reportDays.map((day) => (
              <View key={day.date} style={styles.reportDay}>
                <Text style={styles.reportDate}>{day.date}</Text>
                {day.sliders.map((s) => (
                  <Text key={s.id} style={styles.reportLine}>
                    {s.name}: {s.value} / {s.maxValue} {s.unit}
                  </Text>
                ))}
                {day.checks.map((c) => (
                  <Text key={c.id} style={styles.reportLine}>
                    {c.name}: {c.isChecked ? 'Yes' : 'No'}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
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
  },
  sliderRow: { paddingHorizontal: 16, marginBottom: 8 },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  sliderLabel: { fontSize: 16, fontFamily: REGULAR },
  sliderValue: { fontSize: 13, color: c.textSecondary, fontFamily: REGULAR },
  empty: { paddingHorizontal: 16, paddingVertical: 8, color: c.textMuted, fontFamily: REGULAR },
  form: { paddingHorizontal: 16 },
  fieldLabel: { fontSize: 13, color: c.textMuted, marginTop: 16, marginBottom: 6, fontFamily: REGULAR },
  typeReadout: { fontSize: 16, color: c.textSecondary, fontFamily: REGULAR },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, fontSize: 16, fontFamily: REGULAR, color: c.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: c.surface },
  chipActive: { backgroundColor: c.accent },
  chipText: { fontSize: 14, color: c.text, fontFamily: REGULAR },
  chipTextActive: { color: c.accentText },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  rowText: { fontSize: 16, fontFamily: REGULAR },
  yesNoRow: { flexDirection: 'row', gap: 8 },
  yesNoButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: c.surface,
  },
  yesNoButtonActiveYes: { backgroundColor: c.success },
  yesNoButtonActiveNo: { backgroundColor: c.danger },
  yesNoText: { fontSize: 14, color: c.text, fontFamily: REGULAR },
  yesNoTextActive: { color: c.accentText },
  editorContainer: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'ios' ? 60 : 24 },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  editorTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700' },
  editorActions: { flexDirection: 'row', alignItems: 'center' },
  saveButton: { color: c.accent, fontSize: 16, fontFamily: REGULAR },
  reportDay: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  reportDate: { fontSize: 15, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', marginBottom: 4 },
  reportLine: { fontSize: 14, fontFamily: REGULAR, color: c.border, marginTop: 2 },
});
