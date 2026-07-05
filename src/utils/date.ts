import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

export { dayjs };

export const todayISO = (): string => dayjs().format('YYYY-MM-DD');

export const toISO = (d: Date | string | number): string => dayjs(d).format('YYYY-MM-DD');

/** Les n derniers jours (du plus ancien à aujourd'hui). */
export function lastNDays(n: number, from = dayjs()): string[] {
  return Array.from({ length: n }, (_, i) => from.subtract(n - 1 - i, 'day').format('YYYY-MM-DD'));
}

export function formatDay(iso: string): string {
  return dayjs(iso).format('ddd D MMM');
}

export function formatLong(iso: string): string {
  return dayjs(iso).format('dddd D MMMM YYYY');
}

/** "23:15" + "07:00" → durée de sommeil en heures (gère le passage de minuit). */
export function sleepDuration(bedTime: string, wakeTime: string): number {
  const [bh, bm] = bedTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  if ([bh, bm, wh, wm].some((v) => Number.isNaN(v))) return 0;
  let minutes = wh * 60 + wm - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 10) / 10;
}

/** Grille du mois pour la vue calendrier (semaines commençant lundi). */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = dayjs(new Date(year, month, 1));
  const daysInMonth = first.daysInMonth();
  const startOffset = (first.day() + 6) % 7; // lundi = 0
  const cells: (string | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(first.date(d).format('YYYY-MM-DD'));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
