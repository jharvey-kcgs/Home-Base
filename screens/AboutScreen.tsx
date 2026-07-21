// screens/AboutScreen.tsx

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';

const REGULAR = 'PlayfairDisplay_400Regular';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

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

export default function AboutScreen({ navigation }: any) {
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
          About
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.intro}>
          Home Base is your personal hub for the things that are easy to lose track of - plans, tasks,
          habits, and passing thoughts. Everything lives on your Home screen as a widget you can tap into.
        </Text>

        <Section title="The Widgets">
          <Item name="Event Base">
            Dates worth remembering - birthdays, holidays, anything tied to a specific day. Can repeat
            daily, weekly, monthly, or yearly. Today's events show right on your Home screen.
          </Item>
          <Item name="Quote Base">
            A library of quotes, sorted into categories. Home shows one at random each day - the same one
            all day, then a new pick tomorrow.
          </Item>
          <Item name="Task Base">
            To-dos with a priority (1 Urgent to 4 Low) and an optional due date. Sorted so what's due
            soonest - and most urgent - rises to the top. Home shows your next three.
          </Item>
          <Item name="Habit Base">
            Two kinds of tracking: Progress habits (a slider toward a daily goal, like cups of water) and
            Tracking habits (a simple Yes/No, like "Medicine Taken"). Everything resets fresh each day, and
            past days are saved in the Habit Report so you can look back.
          </Item>
          <Item name="Alert Base">
            Reminders with a real notification. Set a specific time, or mark something All Day. Optionally
            get notified 5-60 minutes ahead of time.
          </Item>
          <Item name="Thought Base">
            A notepad for anything that doesn't fit elsewhere - a title and a body, nothing more required.
          </Item>
        </Section>

        <Section title="How Editing Works">
          <Text style={styles.paragraph}>
            Every widget screen has the same pattern: tap the "•••" in the top right to add something new.
            Tap any existing item in the list to open it for editing - from there, "•••" again gives you the
            option to delete it. In Task Base and Alert Base, that same "•••" menu also has a "Clear
            Completed" option to sweep out everything you've already checked off in one go.
          </Text>
        </Section>

        <Section title="FAQ">
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
        </Section>
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
    intro: { fontSize: 15, fontFamily: REGULAR, color: c.textSecondary, paddingHorizontal: 16, marginBottom: 8, lineHeight: 21 },
    section: { marginTop: 20, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', marginBottom: 10 },
    item: { marginBottom: 14 },
    itemName: { fontSize: 15, fontFamily: REGULAR, fontWeight: '700', marginBottom: 2 },
    itemBody: { fontSize: 14, fontFamily: REGULAR, color: c.textSecondary, lineHeight: 20 },
    paragraph: { fontSize: 14, fontFamily: REGULAR, color: c.textSecondary, lineHeight: 20 },
  });
