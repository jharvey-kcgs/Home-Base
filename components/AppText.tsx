// components/AppText.tsx
//
// Swap `import { Text } from 'react-native'` for
// `import Text from '../components/AppText'` in a screen and every
// <Text> in that file automatically respects the Font Size setting -
// no per-style edits needed. Reads whatever fontSize is already in the
// style prop and scales it; defaults to 14 if none was set.

import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../lib/theme';

export default function AppText(props: TextProps) {
  const { theme } = useTheme();
  const flat = (StyleSheet.flatten(props.style) || {}) as { fontSize?: number; color?: string };
  const baseFontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const overrides: { fontSize: number; color?: string } = { fontSize: baseFontSize * theme.fontScale };
  if (!flat.color) overrides.color = theme.colors.text;
  return <RNText {...props} style={[props.style, overrides]} />;
}
