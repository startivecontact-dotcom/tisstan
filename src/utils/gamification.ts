import type { BadgeDef } from '@/types/models';

export interface XpSources {
  weighIns: number;
  meals: number;
  workouts: number;
  sleepLogs: number;
  hydrationDays: number;
  habitChecks: number;
  posts: number;
  bestStreak: number;
}

export const XP_RULES: Record<keyof XpSources, number> = {
  weighIns: 10,
  meals: 5,
  workouts: 30,
  sleepLogs: 10,
  hydrationDays: 5,
  habitChecks: 5,
  posts: 15,
  bestStreak: 20,
};

export function totalXp(s: XpSources): number {
  return (Object.keys(XP_RULES) as (keyof XpSources)[]).reduce(
    (acc, k) => acc + XP_RULES[k] * (s[k] || 0),
    0,
  );
}

/** Niveau : progression douce en racine carrée (niveau 1 = 0 XP). */
export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100;
}

/** Progression 0..1 dans le niveau courant. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return Math.min(1, (xp - cur) / (next - cur));
}

export const BADGES: BadgeDef[] = [
  { id: 'spark', name: 'Étincelle', emoji: '✨', description: 'Gagne 100 XP', xp: 100 },
  { id: 'flame', name: 'Flamme', emoji: '🔥', description: 'Gagne 500 XP', xp: 500 },
  { id: 'machine', name: 'Machine', emoji: '⚙️', description: 'Gagne 1 500 XP', xp: 1500 },
  { id: 'titan', name: 'Titan', emoji: '🗿', description: 'Gagne 3 000 XP', xp: 3000 },
  { id: 'legend', name: 'Légende', emoji: '👑', description: 'Gagne 6 000 XP', xp: 6000 },
];

export function earnedBadges(xp: number): BadgeDef[] {
  return BADGES.filter((b) => xp >= b.xp);
}

export const DAILY_CHALLENGES = [
  { id: 'water8', emoji: '💧', text: 'Bois 8 verres d’eau' },
  { id: 'protein', emoji: '🍗', text: 'Atteins ton objectif protéines' },
  { id: 'walk', emoji: '🚶', text: 'Marche 20 minutes' },
  { id: 'sleep', emoji: '😴', text: 'Couche-toi avant 23h30' },
  { id: 'veggies', emoji: '🥦', text: 'Ajoute des légumes à 2 repas' },
  { id: 'noSugar', emoji: '🚫', text: 'Zéro sucre ajouté aujourd’hui' },
  { id: 'stretch', emoji: '🧘', text: '10 minutes d’étirements' },
];

/** Défi du jour, stable sur la journée et différent pour chaque utilisateur. */
export function challengeOfDay(dateISO: string, salt = 0) {
  let h = salt;
  for (const c of dateISO) h = (h * 33 + c.charCodeAt(0)) % 99991;
  return DAILY_CHALLENGES[h % DAILY_CHALLENGES.length];
}
