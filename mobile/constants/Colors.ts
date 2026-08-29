// Premium dating app color system — warm, elegant, not "cyber"
export const Colors = {
  // Brand
  primary: '#E8526A',       // Warm coral-rose
  primaryLight: '#F07A8E',
  primaryDark: '#C93550',
  secondary: '#F5A623',     // Warm amber accent
  
  // Neutrals (warm-tinted)
  background: '#0F0D12',    // Deep warm black
  surface: '#1A1720',       // Card background
  surfaceElevated: '#221F2B',
  border: '#2E2A38',
  borderLight: '#3D3849',

  // Text
  textPrimary: '#F2EEF8',
  textSecondary: '#A89FC0',
  textMuted: '#6B6180',
  textInverse: '#0F0D12',

  // Semantic
  success: '#4ECDC4',
  warning: '#F5A623',
  error: '#FF6B6B',
  info: '#6C8EF5',

  // Gradients
  gradientPrimary: ['#E8526A', '#C93550'] as const,
  gradientCard: ['#1A1720', '#221F2B'] as const,
  gradientHero: ['#E8526A', '#F5A623'] as const,
  gradientDark: ['#0F0D12', '#1A1720'] as const,

  // Match actions
  like: '#4ECDC4',
  superLike: '#6C8EF5',
  nope: '#FF6B6B',
  boost: '#F5A623',

  // Overlay
  overlay: 'rgba(15,13,18,0.85)',
  overlayLight: 'rgba(15,13,18,0.4)',

  // Tab bar
  tabActive: '#E8526A',
  tabInactive: '#6B6180',
}

export const Shadows = {
  sm: {
    shadowColor: '#E8526A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  glow: {
    shadowColor: '#E8526A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
}
