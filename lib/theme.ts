// Shared design tokens: dark, high-end tech product — near-black/charcoal
// surfaces, restrained red used only for CTAs/active states/highlights.
export const theme = {
  bg: '#08080A',
  bgElevated: '#111114',
  bgCard: '#16161A',
  bgCardHover: '#1B1B20',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F4F4F6',
  textMuted: '#A3A3AC',
  textFaint: '#6B6B74',
  red: '#FF3B30',
  redSoft: '#FF6259',
  redGlow: 'rgba(255,59,48,0.45)',
  redDim: 'rgba(255,59,48,0.12)',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
} as const;

export const transition = 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)';
