// screens/ProfileSettingsScreen.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { View, TextInput, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, updateSettings } from '../lib/storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

export default function ProfileSettingsScreen({ navigation }: any) {
  const { theme, refresh } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const load = useCallback(async () => {
    setSettings(await getSettings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const saveName = async () => {
    const next = await updateSettings({ userName: (settings.userName ?? '').trim() || null });
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
          Profile
        </Text>
        <View style={styles.headerSide} />
      </View>

      <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textMuted}
          placeholder="Your name"
          value={settings.userName ?? ''}
          onChangeText={(v) => setSettings((prev) => ({ ...prev, userName: v }))}
          onEndEditing={saveName}
          maxLength={24}
        />
        <Text style={styles.note}>Your Home screen reads "{(settings.userName || 'Your Name').trim()}'s Base".</Text>
      </View>
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
    fieldLabel: { fontSize: 13, color: c.textMuted, fontFamily: REGULAR, paddingHorizontal: 16, marginTop: 20, marginBottom: 6 },
    input: {
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      fontFamily: REGULAR,
      color: c.text,
    },
    note: { fontSize: 12, color: c.textMuted, fontFamily: REGULAR, paddingHorizontal: 16, marginTop: 10 },
  });
