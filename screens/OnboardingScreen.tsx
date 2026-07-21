// screens/OnboardingScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { updateSettings } from '../lib/storage';

const REGULAR = 'PlayfairDisplay_400Regular';
const NAME_MAX_LENGTH = 24; // keeps "<Name>'s Base" from ever overwhelming the header

export default function OnboardingScreen({ onDone }: { onDone: (wantsTour: boolean) => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const [name, setName] = useState('');
  const [step, setStep] = useState<'name' | 'tour'>('name');

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await updateSettings({ userName: trimmed });
    setStep('tour');
  };

  if (step === 'tour') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, { maxWidth: 480, width: '100%', alignSelf: 'center' }]}>
          <Text style={styles.heading}>Want a quick tour?</Text>
          <Text style={styles.subheading}>
            A short look at what each widget does and how editing works - takes about a minute.
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => onDone(true)}>
            <Text style={styles.buttonText}>Yes, show me around</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => onDone(false)}>
            <Text style={styles.secondaryButtonText}>No thanks, take me in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.content, { maxWidth: 480, width: '100%', alignSelf: 'center' }]}>
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.subheading}>What should we call your Base?</Text>

          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={NAME_MAX_LENGTH}
            autoFocus
            onSubmitEditing={handleContinue}
            returnKeyType="done"
          />

          {name.trim().length > 0 && (
            <Text style={styles.preview}>Your home will read "{name.trim()}'s Base"</Text>
          )}

          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
    heading: {
      fontFamily: 'PlayfairDisplay_700Bold',
      fontWeight: '700',
      fontSize: 34,
      textAlign: 'center',
      marginBottom: 8,
    },
    subheading: {
      fontFamily: REGULAR,
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: 28,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 14,
      fontSize: 18,
      fontFamily: REGULAR,
      color: c.text,
      textAlign: 'center',
    },
    preview: {
      fontFamily: REGULAR,
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 12,
    },
    button: {
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 28,
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: c.accentText, fontFamily: REGULAR, fontSize: 16, fontWeight: '600' },
    secondaryButton: {
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    secondaryButtonText: { color: c.textSecondary, fontFamily: REGULAR, fontSize: 15 },
  });
