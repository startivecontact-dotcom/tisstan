import { dayjs } from '@/utils/date';

/**
 * Longueur de la série en cours : nombre de jours consécutifs actifs en
 * remontant depuis aujourd'hui. Un "trou" aujourd'hui est toléré (la journée
 * n'est pas finie), mais pas avant.
 */
export function currentStreak(activeDates: string[], today = dayjs().format('YYYY-MM-DD')): number {
  const set = new Set(activeDates);
  let streak = 0;
  let cursor = dayjs(today);
  if (!set.has(cursor.format('YYYY-MM-DD'))) cursor = cursor.subtract(1, 'day');
  while (set.has(cursor.format('YYYY-MM-DD'))) {
    streak++;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

/** Meilleure série historique. */
export function bestStreak(activeDates: string[]): number {
  const sorted = [...new Set(activeDates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && dayjs(d).diff(dayjs(prev), 'day') === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
