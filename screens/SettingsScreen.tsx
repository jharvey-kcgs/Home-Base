// screens/SettingsScreen.tsx
//
// Top-level Settings is just a nav list into 4 nested pages - Profile,
// Theme, Notifications, About. Keeps each page focused and short.

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';

const REGULAR = 'PlayfairDisplay_400Regular';

const ROWS: { label: string; route: string }[] = [
  { label: 'Profile', route: 'ProfileSettings' },
  { label: 'Theme', route: 'ThemeSettings' },
  { label: 'Notifications', route: 'NotificationSettings' },
  { label: 'Data', route: 'DataSettings' },
  { label: 'About', route: 'About' },
  { label: 'FAQ', route: 'FAQ' },
];

export default function SettingsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.back}>‹ Home Base</Text>
        </TouchableOpacity>
        <Text style={styles.title} pointerEvents="none">
          Settings
        </Text>
        <View style={styles.headerSide} />
      </View>

      <View style={[styles.list, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]}>
        {ROWS.map((row) => (
          <TouchableOpacity key={row.route} style={styles.row} onPress={() => navigation.navigate(row.route)}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
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
    back: { color: c.accentReadable, fontSize: 16, fontFamily: REGULAR },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 26,
      fontFamily: 'PlayfairDisplay_700Bold',
      fontWeight: '700',
      paddingHorizontal: 4,
    },
    headerSide: { minWidth: 70, flexShrink: 0 },
    list: { marginTop: 12 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    rowLabel: { fontSize: 17, fontFamily: REGULAR },
    chevron: { fontSize: 20, color: c.textMuted },
  });
