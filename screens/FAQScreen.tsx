// screens/FAQScreen.tsx

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';

const REGULAR = 'PlayfairDisplay_400Regular';

function Item({ name, children }: { name: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  return (
    <View style={styles.item}>
      <Text style={styles.itemName}>{name}</Text>
      <Text style={styles.itemBody}>{children}</Text>
    </View>
  );
}

export default function FAQScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.back}>‹ Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title} pointerEvents="none">
          FAQ
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.section}>
          <Item name="Is my data private?">
            Yes. Everything is stored only on this device - there's no account, no server, and nothing is
            ever sent anywhere.
          </Item>
          <Item name="Why did my habit progress reset overnight?">
            Your list of habits never changes on its own - only the day's number or checkbox resets, so
            you're not stuck manually zeroing things out every morning. Yesterday's value is saved into
            the Habit Report first, so nothing is lost. A habit only ever disappears if you delete it
            yourself.
          </Item>
          <Item name="How do notifications actually work?">
            Alert Base schedules real local notifications on your phone - they'll arrive even if Home Base
            isn't open. You can turn this off entirely in Settings → Notifications.
          </Item>
          <Item name="What does Vacation Mode do?">
            While a date range is set in Settings → Notifications, no new alert notifications will be
            scheduled - useful if you want a quiet stretch without turning notifications off for good.
          </Item>
          <Item name="Can I change my name or the app's look later?">
            Any time - Settings → Profile for your name, Settings → Theme for Dark Mode, font size, and
            accent color.
          </Item>
          <Item name="Can I back up my data?">
            Yes - Settings → Data → Share Backup gives you a backup you can save, email to yourself, or
            AirDrop somewhere safe. Restoring replaces everything currently in the app, so double-check
            before confirming.
          </Item>
          <Item name="Why won't my reminder notify me?">
            Home Base only asks for notification permission the first time you actually set one up, not the
            moment you open the app. If you said no at that point, any reminder you create will still save
            correctly, but you'll see a note pointing you to Settings → Notifications to turn them back on.
          </Item>
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
    back: { color: c.accentReadable, fontSize: 16, fontFamily: REGULAR },
    title: { flex: 1, textAlign: 'center', fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', paddingHorizontal: 8 },
    headerSide: { minWidth: 70, flexShrink: 0 },
    section: { marginTop: 8, paddingHorizontal: 16 },
    item: { marginBottom: 14 },
    itemName: { fontSize: 15, fontFamily: REGULAR, fontWeight: '700', marginBottom: 2 },
    itemBody: { fontSize: 14, fontFamily: REGULAR, color: c.textSecondary, lineHeight: 20 },
  });
