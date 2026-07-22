// screens/NotificationSettingsScreen.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch, Platform, Linking } from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getSettings, updateSettings } from '../lib/storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

export default function NotificationSettingsScreen({ navigation }: any) {
  const { theme, refresh } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const load = useCallback(async () => {
    setSettings(await getSettings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const apply = async (updates: Partial<AppSettings>) => {
    const next = await updateSettings(updates);
    setSettings(next);
    await refresh();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.back}>‹ Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title} pointerEvents="none">
          Notifications
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Enable Notifications</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => apply({ notificationsEnabled: v })}
            trackColor={{ true: theme.colors.accent }}
          />
        </View>
        <Text style={styles.note}>
          Turns Home Base's own alert scheduling on or off. For sound, banner style, or other notification
          behavior, that's controlled by iOS itself.
        </Text>
        <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.linkButtonText}>Open Phone Notification Settings</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Vacation Mode</Text>
        <Text style={styles.note}>While a date range is set here, new alert notifications won't be scheduled.</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Start</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
            <Text style={{ fontFamily: REGULAR }}>{settings.vacationStart ?? 'Not set'}</Text>
          </TouchableOpacity>
        </View>
        {showStartPicker && (
          <DateTimePicker
            themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
            value={settings.vacationStart ? new Date(settings.vacationStart + 'T00:00:00') : new Date()}
            mode="date"
            onChange={(_, selected) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (selected) apply({ vacationStart: selected.toISOString().slice(0, 10) });
            }}
          />
        )}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>End</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
            <Text style={{ fontFamily: REGULAR }}>{settings.vacationEnd ?? 'Not set'}</Text>
          </TouchableOpacity>
        </View>
        {showEndPicker && (
          <DateTimePicker
            themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
            value={settings.vacationEnd ? new Date(settings.vacationEnd + 'T00:00:00') : new Date()}
            mode="date"
            onChange={(_, selected) => {
              setShowEndPicker(Platform.OS === 'ios');
              if (selected) apply({ vacationEnd: selected.toISOString().slice(0, 10) });
            }}
          />
        )}

        {(settings.vacationStart || settings.vacationEnd) && (
          <TouchableOpacity style={styles.clearButton} onPress={() => apply({ vacationStart: null, vacationEnd: null })}>
            <Text style={styles.clearButtonText}>Clear Vacation Mode</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
    title: { flex: 1, textAlign: 'center', fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', paddingHorizontal: 8 },
    headerSide: { minWidth: 70, flexShrink: 0 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    rowLabel: { fontSize: 16, fontFamily: REGULAR },
    sectionHeader: {
      fontSize: 13,
      fontFamily: REGULAR,
      color: c.textMuted,
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
    },
    note: { fontSize: 12, color: c.textMuted, fontFamily: REGULAR, paddingHorizontal: 16, marginTop: 6 },
    dateButton: { padding: 8, borderWidth: 1, borderColor: c.border, borderRadius: 8 },
    linkButton: { marginHorizontal: 16, marginTop: 10 },
    linkButtonText: { color: c.accent, fontFamily: REGULAR, fontSize: 14 },
    clearButton: { margin: 16, padding: 12, borderRadius: 10, backgroundColor: c.surface, alignItems: 'center' },
    clearButtonText: { color: c.danger, fontFamily: REGULAR, fontWeight: '600' },
  });
