// App.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import HomeScreen from './screens/HomeScreen';
import EventsScreen from './screens/EventsScreen';
import QuotesScreen from './screens/QuotesScreen';
import TasksScreen from './screens/TasksScreen';
import HabitsScreen from './screens/HabitsScreen';
import AlertsScreen from './screens/AlertsScreen';
import ThoughtsScreen from './screens/ThoughtsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';
import ThemeSettingsScreen from './screens/ThemeSettingsScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import DataSettingsScreen from './screens/DataSettingsScreen';
import AboutScreen from './screens/AboutScreen';
import FAQScreen from './screens/FAQScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { getSettings } from './lib/storage';
import { ThemeProvider, useTheme } from './lib/theme';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

function RootGate() {
  const { theme } = useTheme();
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [wantsTour, setWantsTour] = useState(false);

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setNeedsOnboarding(!settings.userName);
      setChecked(true);
    })();
  }, []);

  if (!checked) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        onDone={(tour: boolean) => {
          setWantsTour(tour);
          setNeedsOnboarding(false);
        }}
      />
    );
  }

  return <ThemedApp showTourOnReady={wantsTour} />;
}

function ThemedApp({ showTourOnReady }: { showTourOnReady: boolean }) {
  const { theme } = useTheme();

  const navTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        if (showTourOnReady) {
          // Push Settings then About, so the back button (labeled "‹ Settings")
          // actually leads somewhere consistent with what it says.
          navigationRef.current?.navigate('Settings');
          navigationRef.current?.navigate('About');
        }
      }}
    >
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="Quotes" component={QuotesScreen} />
          <Stack.Screen name="Tasks" component={TasksScreen} />
          <Stack.Screen name="Habits" component={HabitsScreen} />
          <Stack.Screen name="Alerts" component={AlertsScreen} />
          <Stack.Screen name="Thoughts" component={ThoughtsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
          <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="DataSettings" component={DataSettingsScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="FAQ" component={FAQScreen} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <RootGate />
    </ThemeProvider>
  );
}
