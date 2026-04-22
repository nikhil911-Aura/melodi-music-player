export const Colors = {
  primary: '#FF6B35',      // orange accent
  primaryLight: '#FF8C5A',
  background: '#0A0A0F',
  surface: '#141420',
  surfaceLight: '#1E1E2E',
  card: '#1A1A28',
  border: '#2A2A3A',
  text: '#FFFFFF',
  textSecondary: '#9090A0',
  textMuted: '#555568',
  success: '#4CAF50',
  error: '#F44336',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  h4: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
