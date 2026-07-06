import type { UserId } from '@/types/models';

/**
 * Thèmes par utilisateur :
 *  - Stanne  → sombre premium noir / vert / bleu (Whoop, Apple Fitness).
 *  - Tissam  → rose poudré / lilas / lapins 🐰 (dentelle, pastel).
 * Les classes NativeWind (bg-bg, text-ink, bg-brand/15…) pointent vers des
 * variables CSS injectées à la racine, donc toute l'app se re-colore selon
 * l'utilisateur connecté.
 */
export interface Palette {
  bg: string;
  surface: string;
  card: string;
  cardAlt: string;
  line: string;
  ink: string;
  mute: string;
  brand: string;
  brandDim: string;
  sky: string;
  skyDim: string;
  warn: string;
  danger: string;
  violet: string;
  /** Thème sombre (pilote la barre de statut). */
  dark: boolean;
}

export const THEMES: Record<UserId, Palette> = {
  stanne: {
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
    dark: true,
  },
  tissam: {
    bg: '#FDF6F9',
    surface: '#F7EAF1',
    card: '#FFFFFF',
    cardAlt: '#FBEFF5',
    line: '#EFD8E4',
    ink: '#43273A',
    mute: '#A57F94',
    brand: '#E0699F',
    brandDim: '#C94E88',
    sky: '#9B7EDE',
    skyDim: '#7C5CC9',
    warn: '#D98A2B',
    danger: '#D9486C',
    violet: '#8B5CF6',
    dark: false,
  },
};

/**
 * Palette active, importée partout (icônes, graphiques, dégradés…).
 * Mutée en place par applyTheme() au changement d'utilisateur — les écrans
 * étant remontés à la connexion/déconnexion, ils lisent la bonne valeur.
 */
export const colors: Palette = { ...THEMES.stanne };

export function applyTheme(userId: UserId | null): void {
  Object.assign(colors, THEMES[userId ?? 'stanne']);
}

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Variables CSS consommées par tailwind.config.js (triplets "R G B"). */
export function themeVars(p: Palette): Record<string, string> {
  return {
    '--c-bg': hexToRgbTriplet(p.bg),
    '--c-surface': hexToRgbTriplet(p.surface),
    '--c-card': hexToRgbTriplet(p.card),
    '--c-cardAlt': hexToRgbTriplet(p.cardAlt),
    '--c-line': hexToRgbTriplet(p.line),
    '--c-ink': hexToRgbTriplet(p.ink),
    '--c-mute': hexToRgbTriplet(p.mute),
    '--c-brand': hexToRgbTriplet(p.brand),
    '--c-brandDim': hexToRgbTriplet(p.brandDim),
    '--c-sky': hexToRgbTriplet(p.sky),
    '--c-skyDim': hexToRgbTriplet(p.skyDim),
    '--c-warn': hexToRgbTriplet(p.warn),
    '--c-danger': hexToRgbTriplet(p.danger),
  };
}

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
