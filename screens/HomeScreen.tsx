// screens/HomeScreen.tsx

import React, { useCallback, useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useFocusEffect } from '@react-navigation/native';
import {
  checkAndRunDailyHabitReset,
  getEventsForToday,
  getQuoteOfTheDay,
  getTasks,
  getHabitSliders,
  getHabitChecks,
  getAlerts,
  getThoughts,
  getSettings,
} from '../lib/storage';
import { Event, Quote, Task, HabitSlider, HabitCheck, Alert as AlertModel, Thought } from '../types/models';
import { useResponsive } from '../lib/responsive';

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const [events, setEvents] = useState<Event[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sliders, setSliders] = useState<HabitSlider[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);
  const [alerts, setAlerts] = useState<AlertModel[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState<string | null>(null);

  const { maxContentWidth, scale } = useResponsive();

  const load = useCallback(async () => {
    await checkAndRunDailyHabitReset();
    const [ev, q, t, s, c, r, th, settings] = await Promise.all([
      getEventsForToday(),
      getQuoteOfTheDay(),
      getTasks(),
      getHabitSliders(),
      getHabitChecks(),
      getAlerts(),
      getThoughts(),
      getSettings(),
    ]);
    setEvents(ev);
    setQuote(q);
    setTasks(t.filter((x) => !x.isDone).slice(0, 3));
    setSliders(s);
    setChecks(c);
    setAlerts(r.filter((x) => !x.isCompleted).slice(0, 3));
    setThoughts(th.slice(0, 3));
    setUserName(settings.userName);
    setNow(new Date());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // "July 16, 2026" - no weekday, no time.
  const dateStr = now.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const headerTitle = userName ? `${userName}'s Base` : 'Home Base';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingHorizontal: 20 * scale }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerSide}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={[styles.headerIcon, { fontSize: 24 * scale }]}>✿</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { fontSize: 22 * scale }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {headerTitle}
        </Text>
        <TouchableOpacity
          onPress={load}
          style={[styles.headerSide, { alignItems: 'flex-end' }]}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={[styles.headerIcon, { fontSize: 24 * scale }]}>⌂</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollOuter, { minHeight: '100%' }]}>
        <View style={[styles.content, { maxWidth: maxContentWidth, padding: 12 * scale }]}>
          {/* Widget 1 - full width: Date + Events */}
          <TouchableOpacity
            style={[styles.cardFull, { padding: 18 * scale, marginBottom: 14 * scale }]}
            onPress={() => navigation.navigate('Events')}
          >
            <Text style={[styles.bigDate, { fontSize: 24 * scale }]}>{dateStr}</Text>
            {events.length > 0 ? (
              events.map((e) => (
                <Text key={e.id} style={[styles.eventText, { fontSize: 15 * scale }]}>
                  🎉 {e.name}
                </Text>
              ))
            ) : (
              <Text style={[styles.mutedText, { fontSize: 14 * scale }]}>No events today</Text>
            )}
          </TouchableOpacity>

          {/* Widgets 2 & 3 - side by side */}
          <View style={[styles.row, { gap: 12 * scale, marginBottom: 14 * scale }]}>
            <TouchableOpacity
              style={[styles.cardHalf, { padding: 18 * scale, minHeight: 140 * scale }]}
              onPress={() => navigation.navigate('Quotes')}
            >
              <Text style={[styles.cardTitle, { fontSize: 18 * scale }]}>Quote of the Day</Text>
              <Text style={[styles.quoteText, { fontSize: 14 * scale }]} numberOfLines={5}>
                {quote ? quote.text : 'Add a quote →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cardHalf, { padding: 18 * scale, minHeight: 140 * scale }]}
              onPress={() => navigation.navigate('Tasks')}
            >
              <Text style={[styles.cardTitle, { fontSize: 18 * scale }]}>Tasks</Text>
              {tasks.length > 0 ? (
                tasks.map((t) => (
                  <Text key={t.id} style={[styles.listItem, { fontSize: 13 * scale }]} numberOfLines={1}>
                    • {t.name}
                  </Text>
                ))
              ) : (
                <Text style={[styles.mutedText, { fontSize: 14 * scale }]}>Nothing pending</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Widget 4 - full width: Habit tracker */}
          <TouchableOpacity
            style={[styles.cardFull, { padding: 18 * scale, marginBottom: 14 * scale }]}
            onPress={() => navigation.navigate('Habits')}
          >
            <Text style={[styles.cardTitle, { fontSize: 18 * scale }]}>Habits</Text>
            <View style={styles.habitRow}>
              {sliders.map((s) => (
                <Text key={s.id} style={[styles.habitChip, { fontSize: 12 * scale }]}>
                  {s.name}: {s.value}/{s.maxValue} {s.unit}
                </Text>
              ))}
            </View>
            <View style={styles.habitRow}>
              {checks.map((c) => (
                <Text key={c.id} style={[styles.habitChip, { fontSize: 12 * scale }]}>
                  {c.name}: {c.isChecked ? 'Y' : 'N'}
                </Text>
              ))}
            </View>
          </TouchableOpacity>

          {/* Widgets 5 & 6 - side by side */}
          <View style={[styles.row, { gap: 12 * scale }]}>
            <TouchableOpacity
              style={[styles.cardHalf, { padding: 18 * scale, minHeight: 140 * scale }]}
              onPress={() => navigation.navigate('Alerts')}
            >
              <Text style={[styles.cardTitle, { fontSize: 18 * scale }]}>Alerts</Text>
              {alerts.length > 0 ? (
                alerts.map((a) => (
                  <Text key={a.id} style={[styles.listItem, { fontSize: 13 * scale }]} numberOfLines={1}>
                    • {a.name}
                  </Text>
                ))
              ) : (
                <Text style={[styles.mutedText, { fontSize: 14 * scale }]}>Nothing set</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cardHalf, { padding: 18 * scale, minHeight: 140 * scale }]}
              onPress={() => navigation.navigate('Thoughts')}
            >
              <Text style={[styles.cardTitle, { fontSize: 18 * scale }]}>Thoughts</Text>
              {thoughts.length > 0 ? (
                thoughts.map((t) => (
                  <Text key={t.id} style={[styles.listItem, { fontSize: 13 * scale }]} numberOfLines={1}>
                    • {t.title}
                  </Text>
                ))
              ) : (
                <Text style={[styles.mutedText, { fontSize: 14 * scale }]}>Nothing yet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerIcon: {},
  headerSide: { minWidth: 40, flexShrink: 0 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  scrollOuter: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  content: { width: '100%' },
  cardFull: { borderWidth: 1, borderColor: c.border, borderRadius: 16 },
  row: { flexDirection: 'row' },
  cardHalf: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 16 },
  cardTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', marginBottom: 8 },
  bigDate: { fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', marginBottom: 8 },
  eventText: { marginTop: 2, fontFamily: 'PlayfairDisplay_400Regular' },
  mutedText: { color: c.textMuted, fontFamily: 'PlayfairDisplay_400Regular' },
  quoteText: { fontFamily: 'PlayfairDisplay_400Regular_Italic' },
  listItem: { marginTop: 4, fontFamily: 'PlayfairDisplay_400Regular' },
  habitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  habitChip: {
    backgroundColor: c.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontFamily: 'PlayfairDisplay_400Regular',
  },
});
