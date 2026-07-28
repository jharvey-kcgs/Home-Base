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
            Two common reasons. First: Home Base only asks for notification permission the first time you
            actually set one up, not the moment you open the app - if you said no then, the alert still
            saves correctly, but you'll see a note pointing you to Settings → Notifications to turn them
            back on. Second: if the notification time you picked has already passed by the time you save
            it, you'll get a plain warning explaining that instead of the app just staying silent.
          </Item>
          <Item name="Can an Event remind me too?">
            Yes - turn on "Also set a reminder" when creating or editing an event. It creates a real,
            separate entry in Alert Base that you can also view and edit there, and it automatically
            repeats on the same schedule as the event itself.
          </Item>
          <Item name='Why does the notification badge just show a plain "1" instead of a count?'>
            On purpose. A precise running count (2, 3, 4...) isn't something a phone can reliably promise
            for reminders scheduled in advance and delivered while the app is closed - the number would
            often just be wrong. Rather than show a count that can't be trusted, the badge simply shows
            "something's waiting" and clears itself the moment you open the app or view a notification.
          </Item>
          <Item name="Can I start over completely?">
            Yes - Settings → Data → Reset App Data permanently clears everything: every event, quote,
            task, habit, alert, and thought, plus your name and theme settings. It asks you to confirm
            twice before doing anything, since it can't be undone. Worth exporting a backup first if
            there's any chance you'll want the data again.
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
