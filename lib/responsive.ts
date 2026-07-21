// lib/responsive.ts
//
// One place to decide "how big should things be" based on screen width,
// so the layout fills an iPad nicely instead of looking like a phone
// layout with empty margins.

import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Cap content width on very large screens so cards don't stretch edge
  // to edge into unreadable full-width blocks - center a comfortable
  // reading width instead, like a tablet app should.
  const maxContentWidth = isTablet ? Math.min(width * 0.85, 900) : width;

  // A single scale factor for font sizes / padding, so things grow a
  // bit on tablet without a separate style sheet.
  const scale = isTablet ? 1.3 : 1;

  return { width, isTablet, maxContentWidth, scale };
}
