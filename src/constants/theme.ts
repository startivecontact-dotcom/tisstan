/**
 * Palette premium TisStan — noir / blanc / vert / bleu.
 * Utilisée par les composants qui ont besoin de couleurs hors NativeWind
 * (icônes Lucide, graphiques SVG, dégradés…).
 */
export const colors = {
  bg: '#0A0F0D',
  surface: '#101714',
  card: '#151E1A',
  cardAlt: '#1A2620',
  line: '#233029',
  ink: '#F4F7F5',
  mute: '#8CA096',
  brand: '#34D399',
  brandDim: '#10B981',
  sky: '#38BDF8',
  skyDim: '#0EA5E9',
  warn: '#FBBF24',
  danger: '#F87171',
  violet: '#A78BFA',
} as const;

export const gradients = {
  brand: ['#10B981', '#34D399'] as const,
  sky: ['#0EA5E9', '#38BDF8'] as const,
  night: ['#101714', '#0A0F0D'] as const,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
