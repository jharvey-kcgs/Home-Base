// screens/FAQScreen.tsx

import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';

const REGULAR = 'PlayfairDisplay_400Regular';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is my data private?',
    a: "Yes. Everything is stored only on this device - there's no account, no server, and nothing is ever sent anywhere.",
  },
  {
    q: 'Why did my habit progress reset overnight?',
    a: "Your list of habits never changes on its own - only the day's number or checkbox resets, so you're not stuck manually zeroing things out every morning. Yesterday's value is saved into the Habit Report first, so nothing is lost. A habit only ever disappears if you delete it yourself.",
  },
  {
    q: 'How do notifications actually work?',
    a: "Alert Base schedules real local notifications on your phone - they'll arrive even if Home Base isn't open. You can turn this off entirely in Settings → Notifications.",
  },
  {
    q: 'What does Vacation Mode do?',
    a: 'While a date range is set in Settings → Notifications, no new alert notifications will be scheduled - useful if you want a quiet stretch without turning notifications off for good.',
  },
  {
    q: "Can I change my name or the app's look later?",
    a: 'Any time - Settings → Profile for your name, Settings → Theme for Dark Mode, font size, and accent color.',
  },
  {
    q: 'Can I back up my data?',
    a: 'Yes - Settings → Data → Export Backup creates a real backup file you can save to Files, email to yourself, or AirDrop somewhere safe. Restoring is Choose Backup File, which replaces everything currently in the app, so double-check before confirming.',
  },
  {
    q: "Why won't my reminder notify me?",
    a: "Two common reasons. First: Home Base only asks for notification permission the first time you actually set one up, not the moment you open the app - if you said no then, the alert still saves correctly, but you'll see a note pointing you to Settings → Notifications to turn them back on. Second: if the notification time you picked has already passed by the time you save it, you'll get a plain warning explaining that instead of the app just staying silent.",
  },
  {
    q: 'Can an Event remind me too?',
    a: 'Yes - turn on "Also set a reminder" when creating or editing an event. It creates a real, separate entry in Alert Base that you can also view and edit there, and it automatically repeats on the same schedule as the event itself.',
  },
  {
    q: 'Why does the notification badge just show a plain "1" instead of a count?',
    a: "On purpose. A precise running count (2, 3, 4...) isn't something a phone can reliably promise for reminders scheduled in advance and delivered while the app is closed - the number would often just be wrong. Rather than show a count that can't be trusted, the badge simply shows \"something's waiting\" and clears itself the moment you open the app or view a notification.",
  },
  {
    q: 'Can I start over completely?',
    a: "Yes - Settings → Data → Reset App Data permanently clears everything: every event, quote, task, habit, alert, and thought, plus your name and theme settings. It asks you to confirm twice before doing anything, since it can't be undone. Worth exporting a backup first if there's any chance you'll want the data again.",
  },
];

export default function FAQScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  // Only one answer open at a time; tapping the open one closes it.
  const [open, setOpen] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} accessibilityRole="button" accessibilityLabel="Back to Settings">
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
        <View style={styles.card}>
          {FAQS.map((item, i) => {
            const expanded = open === i;
            return (
              <View key={item.q} style={i > 0 ? styles.rowDivider : undefined}>
                <Pressable
                  onPress={() => setOpen(expanded ? null : i)}
                  style={styles.questionRow}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={item.q}
                  accessibilityHint={expanded ? 'Collapses the answer' : 'Expands the answer'}
                >
                  <Text style={styles.question}>{item.q}</Text>
                  <Text style={styles.toggle}>{expanded ? '−' : '+'}</Text>
                </Pressable>
                {expanded ? <Text style={styles.answer}>{item.a}</Text> : null}
              </View>
            );
          })}
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
    card: {
      marginTop: 8,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    questionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    question: { flex: 1, paddingRight: 12, fontSize: 15, fontFamily: REGULAR, fontWeight: '700', color: c.accentReadable },
    toggle: { fontSize: 20, fontFamily: REGULAR, color: c.textMuted },
    answer: { fontSize: 14, fontFamily: REGULAR, color: c.textSecondary, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 16 },
  });
