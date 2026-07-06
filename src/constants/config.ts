import type { UserId, UserProfile } from '@/types/models';

/** Les deux seuls utilisateurs de l'application. */
export const USERS: Record<UserId, Omit<UserProfile, 'goals'>> = {
  stanne: {
    id: 'stanne',
    name: 'Stanne',
    emoji: '🐺',
    color: '#34D399',
    photoUrl: null,
  },
  tissam: {
    id: 'tissam',
    name: 'Tissam',
    emoji: '🐰',
    color: '#E0699F',
    photoUrl: null,
  },
};

export const USER_IDS: UserId[] = ['stanne', 'tissam'];

export const DEFAULT_GOALS = {
  weightKg: 75,
  calories: 2200,
  proteinG: 150,
  carbsG: 220,
  fatG: 70,
  waterGlasses: 8,
  sleepHours: 8,
  workoutsPerWeek: 4,
  stepsPerDay: 10000,
};

export const GLASS_ML = 250;

export const QUOTES = [
  'La discipline est le pont entre les objectifs et les résultats.',
  'Un pas par jour suffit, tant que tu ne recules jamais.',
  'Ton seul adversaire, c’est toi hier.',
  'Les champions s’entraînent, les autres attendent la motivation.',
  'Le corps atteint ce que l’esprit croit.',
  'Chaque repas est un vote pour la personne que tu deviens.',
  'La constance bat le talent quand le talent n’est pas constant.',
  'Dors comme un pro, performe comme un pro.',
  'Petit progrès + répétition = transformation.',
  'Fais-le maintenant. Parfois « plus tard » devient « jamais ».',
  'La sueur d’aujourd’hui est la victoire de demain.',
  'Tu n’as pas besoin d’être extrême, juste constant.',
  'Le meilleur projet sur lequel travailler, c’est toi.',
  'Un esprit fort commence par un corps entretenu.',
];

/** Citation du jour, stable sur la journée. */
export function quoteOfDay(dateISO: string): string {
  let h = 0;
  for (const c of dateISO) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return QUOTES[h % QUOTES.length];
}
