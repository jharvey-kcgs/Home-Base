// screens/ThemeSettingsScreen.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch } from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, updateSettings } from '../lib/storage';
import { AppSettings, DEFAULT_SETTINGS, THEME_COLORS, FontSize } from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

export default function ThemeSettingsScreen({ navigation }: any) {
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
          Theme
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch
            value={settings.themeMode === 'dark'}
            onValueChange={(v) => apply({ themeMode: v ? 'dark' : 'light' })}
            trackColor={{ true: theme.colors.accent }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Font Size</Text>
          <View style={styles.chipRow}>
            {(['small', 'default', 'large'] as FontSize[]).map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.chip, settings.fontSize === size && styles.chipActive]}
                onPress={() => apply({ fontSize: size })}
              >
                <Text style={[styles.chipText, settings.fontSize === size && styles.chipTextActive]}>
                  {size === 'small' ? 'Small' : size === 'default' ? 'Default' : 'Large'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.column}>
          <Text style={styles.rowLabel}>Theme Color</Text>
          <Text style={styles.note}>
            Colors buttons, links, active toggles, selected chips, and the habit slider - not backgrounds
            or body text, so it stays readable in both Light and Dark Mode.
          </Text>
          <View style={styles.swatchRow}>
            {THEME_COLORS.map((c) => (
              <View key={c.hex} style={styles.swatchItem}>
                <TouchableOpacity
                  style={[
                    styles.swatch,
                    { backgroundColor: c.hex },
                    settings.themeColor === c.hex && styles.swatchActive,
                  ]}
                  onPress={() => apply({ themeColor: c.hex })}
                />
                <Text style={styles.swatchLabel}>{c.name}</Text>
              </View>
            ))}
          </View>
        </View>
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
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    column: { paddingHorizontal: 16, paddingVertical: 12 },
    rowLabel: { fontSize: 16, fontFamily: REGULAR },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: c.surface },
    chipActive: { backgroundColor: c.accent },
    chipText: { fontSize: 13, color: c.text, fontFamily: REGULAR },
    chipTextActive: { color: c.accentText },
    swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
    swatchItem: { alignItems: 'center', gap: 4, width: 60 },
    swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#C7C7CC' },
    swatchActive: { borderWidth: 3, borderColor: '#8E8E93' },
    swatchLabel: { fontSize: 11, color: c.textMuted, fontFamily: REGULAR },
    note: { fontSize: 12, color: c.textMuted, fontFamily: REGULAR, marginTop: 6 },
  });
