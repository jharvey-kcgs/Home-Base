// screens/DataSettingsScreen.tsx
//
// Backup/restore without any new native dependencies: export shares the
// backup JSON through the OS share sheet (Messages, Mail, Notes, AirDrop,
// Copy, etc. all work out of the box); import is a paste-the-text field.
// Deliberately simple and text-based, since this is meant to be a
// reliable safety net, not a place to introduce new failure points.

import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Share,
  Alert as RNAlert,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { exportAllData, importAllData, getAlerts, setAlertNotificationId, resetAllData } from '../lib/storage';
import { scheduleAlertNotification, ensureNotificationPermission, cancelAllNotifications } from '../lib/notifications';

const REGULAR = 'PlayfairDisplay_400Regular';

export default function DataSettingsScreen({ navigation }: any) {
  const { theme, refresh } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [importText, setImportText] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const handleExport = async () => {
    setIsWorking(true);
    try {
      const json = await exportAllData();
      await Share.share({
        message: json,
        title: 'Home Base Backup',
      });
    } catch (err) {
      RNAlert.alert('Export failed', 'Something went wrong putting your backup together.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    RNAlert.alert(
      'Replace all current data?',
      'This will overwrite everything currently in Home Base with what\'s in this backup. This can\'t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace Everything', style: 'destructive', onPress: runImport },
      ]
    );
  };

  const runImport = async () => {
    setIsWorking(true);
    try {
      await importAllData(importText.trim());

      // Backed-up alerts reference OS notification IDs that don't carry
      // over - re-schedule anything that isn't completed so reminders
      // keep working after a restore, rather than silently going quiet.
      const restoredAlerts = await getAlerts();
      const pending = restoredAlerts.filter((a) => !a.isCompleted && !a.isAllDay && a.notificationOffsetMinutes != null);
      if (pending.length > 0) {
        const granted = await ensureNotificationPermission();
        if (granted) {
          for (const alert of pending) {
            try {
              const notificationId = await scheduleAlertNotification(alert);
              await setAlertNotificationId(alert.id, notificationId);
            } catch {
              // one bad alert shouldn't stop the rest of the restore
            }
          }
        }
      }

      setImportText('');
      await refresh(); // pushes the restored theme/font-size settings live immediately
      RNAlert.alert('Restored', 'Your backup has been restored. Head back to Home Base to see it.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err: any) {
      RNAlert.alert('Import failed', err?.message || 'Could not read that backup.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleResetData = () => {
    RNAlert.alert(
      'Reset all app data?',
      'This permanently deletes everything in Home Base - events, quotes, tasks, habits, alerts, thoughts, and settings. There is no undo.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: confirmResetData },
      ]
    );
  };

  const confirmResetData = () => {
    RNAlert.alert(
      'Are you absolutely sure?',
      'This is permanent. Consider exporting a backup first if you haven\'t already.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: runReset },
      ]
    );
  };

  const runReset = async () => {
    setIsWorking(true);
    try {
      await cancelAllNotifications();
      await resetAllData();
      await refresh(); // theme/font-size fall back to defaults immediately, not just after restart
      RNAlert.alert(
        'All data cleared',
        'Home Base has been reset. Close and reopen the app to start fresh.',
      );
    } catch (err) {
      RNAlert.alert('Reset failed', 'Something went wrong clearing your data.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.back}>‹ Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title} pointerEvents="none">
          Data
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionHeader}>Export</Text>
        <Text style={styles.note}>
          Everything in Home Base - events, quotes, tasks, habits, alerts, thoughts, and settings - as one
          backup file you can save, email to yourself, or AirDrop somewhere safe.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleExport} disabled={isWorking}>
          <Text style={styles.buttonText}>Share Backup</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Import</Text>
        <Text style={styles.note}>
          Paste in backup text you saved earlier. This replaces everything currently in the app, so make
          sure this is the backup you want.
        </Text>
        <TextInput
          style={styles.textArea}
          placeholderTextColor={theme.colors.textMuted}
          placeholder="Paste your backup here..."
          value={importText}
          onChangeText={setImportText}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.button, (!importText.trim() || isWorking) && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={!importText.trim() || isWorking}
        >
          <Text style={styles.buttonText}>Restore From This Backup</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Reset</Text>
        <Text style={styles.note}>
          Permanently deletes everything in Home Base. There's no undo - export a backup above first if
          there's any chance you'll want this data again.
        </Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetData} disabled={isWorking}>
          <Text style={styles.dangerButtonText}>Reset App Data</Text>
        </TouchableOpacity>
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
    back: { color: c.accentReadable, fontSize: 16, fontFamily: REGULAR },
    title: { flex: 1, textAlign: 'center', fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', paddingHorizontal: 8 },
    headerSide: { minWidth: 70, flexShrink: 0 },
    sectionHeader: {
      fontSize: 13,
      fontFamily: REGULAR,
      color: c.textMuted,
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
    },
    note: { fontSize: 13, color: c.textSecondary, fontFamily: REGULAR, paddingHorizontal: 16, marginBottom: 12, lineHeight: 18 },
    button: { marginHorizontal: 16, backgroundColor: c.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: c.accentText, fontFamily: REGULAR, fontSize: 15, fontWeight: '600' },
    dangerButton: {
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    dangerButtonText: { color: c.danger, fontFamily: REGULAR, fontSize: 15, fontWeight: '600' },
    textArea: {
      marginHorizontal: 16,
      marginBottom: 12,
      minHeight: 120,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 13,
      fontFamily: 'Courier',
      color: c.text,
      textAlignVertical: 'top',
    },
  });
