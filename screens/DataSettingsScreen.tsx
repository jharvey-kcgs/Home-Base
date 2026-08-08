// screens/DataSettingsScreen.tsx
//
// Backup/restore using real JSON files: export writes an actual .json
// file and hands it to the native share sheet (Files, Mail, AirDrop,
// etc. as a proper attachment); import opens the document picker so the
// person selects that same file back. Requires expo-file-system,
// expo-sharing, and expo-document-picker - added deliberately now that
// the project's other dependencies are stable, in exchange for a much
// more standard "export a file, import a file" experience than the
// original paste-text version.

import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert as RNAlert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
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
  const [isWorking, setIsWorking] = useState(false);

  const handleExport = async () => {
    setIsWorking(true);
    try {
      const json = await exportAllData();
      const fileName = `home-base-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File(Paths.document, fileName);
      if (file.exists) file.delete();
      file.create();
      file.write(json);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        RNAlert.alert('Sharing unavailable', "Your device doesn't support sharing files right now.");
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Home Base Backup',
      });
    } catch (err) {
      RNAlert.alert('Export failed', 'Something went wrong putting your backup together.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleImport = async () => {
    let picked: DocumentPicker.DocumentPickerResult;
    try {
      picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'public.json', '*/*'],
        copyToCacheDirectory: true,
      });
    } catch {
      RNAlert.alert('Couldn\'t open file picker', 'Something went wrong trying to browse for a backup file.');
      return;
    }

    if (picked.canceled || !picked.assets || picked.assets.length === 0) return;
    const fileUri = picked.assets[0].uri;

    RNAlert.alert(
      'Replace all current data?',
      "This will overwrite everything currently in Home Base with what's in this backup file. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace Everything', style: 'destructive', onPress: () => runImport(fileUri) },
      ]
    );
  };

  const runImport = async (fileUri: string) => {
    setIsWorking(true);
    try {
      const pickedFile = new File(fileUri);
      const json = await pickedFile.text();
      await importAllData(json);

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

      await refresh(); // pushes the restored theme/font-size settings live immediately
      RNAlert.alert('Restored', 'Your backup has been restored. Head back to Home Base to see it.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err: any) {
      RNAlert.alert('Import failed', err?.message || 'Could not read that backup file.');
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerSide}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Settings"
        >
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
      >
        <Text style={styles.sectionHeader}>Export</Text>
        <Text style={styles.note}>
          Everything in Home Base - events, quotes, tasks, habits, alerts, thoughts, and settings - as a
          real backup file (.json) you can save to Files, email to yourself, or AirDrop somewhere safe.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleExport}
          disabled={isWorking}
          accessibilityRole="button"
          accessibilityState={{ disabled: isWorking }}
        >
          <Text style={styles.buttonText}>Export Backup</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Import</Text>
        <Text style={styles.note}>
          Choose a backup file you saved earlier. This replaces everything currently in the app, so make
          sure this is the backup you want.
        </Text>
        <TouchableOpacity
          style={[styles.button, isWorking && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={isWorking}
          accessibilityRole="button"
          accessibilityState={{ disabled: isWorking }}
        >
          <Text style={styles.buttonText}>Choose Backup File</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Reset</Text>
        <Text style={styles.note}>
          Permanently deletes everything in Home Base. There's no undo - export a backup above first if
          there's any chance you'll want this data again.
        </Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleResetData}
          disabled={isWorking}
          accessibilityRole="button"
          accessibilityState={{ disabled: isWorking }}
          accessibilityHint="Permanently deletes all app data. Asks for confirmation first."
        >
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
  });
