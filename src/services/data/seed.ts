import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFirebaseEnabled } from '@/services/firebase';
import { upsertDoc } from '@/services/data/repo';
import { lastNDays, sleepDuration } from '@/utils/date';
import { uid } from '@/utils/id';
import type {
  Habit,
  HydrationEntry,
  Meal,
  Post,
  Project,
  SleepEntry,
  UserId,
  WeightEntry,
  Workout,
} from '@/types/models';

const SEED_FLAG = 'tisstan:seeded:v1';

/** Générateur pseudo-aléatoire déterministe pour des données de démo stables. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const DEMO_MEALS: Record<Meal['type'], { name: string; quantity: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; sugarG: number; sodiumMg: number }[][]> = {
  breakfast: [
    [
      { name: 'Flocons d’avoine', quantity: '80 g', calories: 300, proteinG: 11, carbsG: 54, fatG: 6, fiberG: 8, sugarG: 1, sodiumMg: 5 },
      { name: 'Banane', quantity: '1', calories: 95, proteinG: 1, carbsG: 24, fatG: 0, fiberG: 3, sugarG: 14, sodiumMg: 1 },
      { name: 'Skyr', quantity: '150 g', calories: 95, proteinG: 16, carbsG: 6, fatG: 0, fiberG: 0, sugarG: 5, sodiumMg: 55 },
    ],
    [
      { name: 'Œufs brouillés', quantity: '3', calories: 220, proteinG: 19, carbsG: 2, fatG: 15, fiberG: 0, sugarG: 1, sodiumMg: 210 },
      { name: 'Pain complet', quantity: '2 tranches', calories: 160, proteinG: 7, carbsG: 28, fatG: 2, fiberG: 4, sugarG: 3, sodiumMg: 280 },
    ],
  ],
  lunch: [
    [
      { name: 'Poulet grillé', quantity: '180 g', calories: 300, proteinG: 55, carbsG: 0, fatG: 7, fiberG: 0, sugarG: 0, sodiumMg: 130 },
      { name: 'Riz basmati', quantity: '150 g cuit', calories: 195, proteinG: 4, carbsG: 42, fatG: 1, fiberG: 1, sugarG: 0, sodiumMg: 2 },
      { name: 'Brocolis', quantity: '200 g', calories: 70, proteinG: 6, carbsG: 10, fatG: 1, fiberG: 5, sugarG: 3, sodiumMg: 60 },
    ],
    [
      { name: 'Saumon', quantity: '160 g', calories: 330, proteinG: 34, carbsG: 0, fatG: 21, fiberG: 0, sugarG: 0, sodiumMg: 90 },
      { name: 'Patate douce', quantity: '200 g', calories: 172, proteinG: 3, carbsG: 40, fatG: 0, fiberG: 6, sugarG: 8, sodiumMg: 70 },
      { name: 'Salade verte', quantity: '1 bol', calories: 35, proteinG: 2, carbsG: 5, fatG: 1, fiberG: 2, sugarG: 2, sodiumMg: 20 },
    ],
  ],
  dinner: [
    [
      { name: 'Bœuf 5%', quantity: '150 g', calories: 260, proteinG: 32, carbsG: 0, fatG: 14, fiberG: 0, sugarG: 0, sodiumMg: 95 },
      { name: 'Pâtes complètes', quantity: '180 g cuites', calories: 250, proteinG: 10, carbsG: 48, fatG: 2, fiberG: 7, sugarG: 2, sodiumMg: 5 },
      { name: 'Courgettes', quantity: '150 g', calories: 25, proteinG: 2, carbsG: 4, fatG: 0, fiberG: 2, sugarG: 3, sodiumMg: 10 },
    ],
    [
      { name: 'Omelette 3 œufs + fromage', quantity: '1', calories: 340, proteinG: 24, carbsG: 3, fatG: 25, fiberG: 0, sugarG: 2, sodiumMg: 420 },
      { name: 'Soupe de légumes', quantity: '1 bol', calories: 90, proteinG: 3, carbsG: 15, fatG: 2, fiberG: 4, sugarG: 7, sodiumMg: 480 },
    ],
  ],
  snack: [
    [
      { name: 'Amandes', quantity: '30 g', calories: 175, proteinG: 6, carbsG: 6, fatG: 15, fiberG: 4, sugarG: 1, sodiumMg: 0 },
      { name: 'Pomme', quantity: '1', calories: 80, proteinG: 0, carbsG: 21, fatG: 0, fiberG: 4, sugarG: 16, sodiumMg: 1 },
    ],
    [
      { name: 'Shake protéiné', quantity: '1 dose', calories: 120, proteinG: 24, carbsG: 3, fatG: 2, fiberG: 0, sugarG: 2, sodiumMg: 150 },
    ],
  ],
};

function makeWorkoutTemplates(userId: UserId, createdAt: number): Workout[] {
  return [
    {
      id: uid(),
      userId,
      createdAt,
      isTemplate: true,
      name: 'Push — Pecs / Épaules / Triceps',
      exercises: [
        { name: 'Développé couché', restSec: 120, sets: [{ reps: 8, weightKg: 70 }, { reps: 8, weightKg: 70 }, { reps: 6, weightKg: 75 }] },
        { name: 'Développé militaire', restSec: 90, sets: [{ reps: 10, weightKg: 40 }, { reps: 10, weightKg: 40 }, { reps: 8, weightKg: 42.5 }] },
        { name: 'Dips', restSec: 90, sets: [{ reps: 12, weightKg: 0 }, { reps: 10, weightKg: 0 }, { reps: 8, weightKg: 0 }] },
      ],
    },
    {
      id: uid(),
      userId,
      createdAt,
      isTemplate: true,
      name: 'Pull — Dos / Biceps',
      exercises: [
        { name: 'Tractions', restSec: 120, sets: [{ reps: 8, weightKg: 0 }, { reps: 7, weightKg: 0 }, { reps: 6, weightKg: 0 }] },
        { name: 'Rowing barre', restSec: 90, sets: [{ reps: 10, weightKg: 60 }, { reps: 10, weightKg: 60 }, { reps: 8, weightKg: 65 }] },
        { name: 'Curl haltères', restSec: 60, sets: [{ reps: 12, weightKg: 14 }, { reps: 10, weightKg: 14 }, { reps: 10, weightKg: 14 }] },
      ],
    },
    {
      id: uid(),
      userId,
      createdAt,
      isTemplate: true,
      name: 'Legs — Jambes',
      exercises: [
        { name: 'Squat', restSec: 150, sets: [{ reps: 8, weightKg: 90 }, { reps: 8, weightKg: 90 }, { reps: 6, weightKg: 100 }] },
        { name: 'Soulevé de terre roumain', restSec: 120, sets: [{ reps: 10, weightKg: 80 }, { reps: 10, weightKg: 80 }, { reps: 8, weightKg: 85 }] },
        { name: 'Fentes marchées', restSec: 90, sets: [{ reps: 12, weightKg: 20 }, { reps: 12, weightKg: 20 }] },
      ],
    },
  ];
}

/**
 * Crée 3 semaines de données réalistes pour chaque utilisateur au premier
 * lancement en mode démo. Ne fait rien si Firebase est configuré (les vraies
 * données vivent alors dans Firestore) ou si le seed a déjà été appliqué.
 */
export async function seedDemoDataIfNeeded(): Promise<void> {
  if (isFirebaseEnabled) return;
  if (await AsyncStorage.getItem(SEED_FLAG)) return;

  const days = lastNDays(21);
  const users: { id: UserId; startWeight: number; seed: number }[] = [
    { id: 'stanne', startWeight: 82.4, seed: 7 },
    { id: 'tissam', startWeight: 77.8, seed: 13 },
  ];

  for (const u of users) {
    const rand = rng(u.seed);
    const templates = makeWorkoutTemplates(u.id, Date.now() - days.length * 86400000);
    for (const t of templates) await upsertDoc('workouts', t);

    for (let i = 0; i < days.length; i++) {
      const date = days[i];
      const createdAt = Date.now() - (days.length - i) * 86400000;

      // Poids : tendance descendante douce + bruit.
      const weight: WeightEntry = {
        id: uid(), userId: u.id, createdAt, date,
        weightKg: Math.round((u.startWeight - i * 0.09 + (rand() - 0.5) * 0.6) * 10) / 10,
      };
      await upsertDoc('weight', weight);

      // Repas : 3 à 4 par jour.
      const mealTypes: Meal['type'][] = rand() > 0.4
        ? ['breakfast', 'lunch', 'dinner', 'snack']
        : ['breakfast', 'lunch', 'dinner'];
      for (const type of mealTypes) {
        const options = DEMO_MEALS[type];
        const meal: Meal = {
          id: uid(), userId: u.id, createdAt: createdAt + 1000, date, type,
          foods: options[Math.floor(rand() * options.length)],
        };
        await upsertDoc('meals', meal);
      }

      // Sommeil.
      const bedTime = `${22 + Math.floor(rand() * 2)}:${rand() > 0.5 ? '30' : '00'}`;
      const wakeTime = `0${6 + Math.floor(rand() * 2)}:${rand() > 0.5 ? '30' : '00'}`;
      const sleep: SleepEntry = {
        id: uid(), userId: u.id, createdAt: createdAt + 2000, date,
        bedTime, wakeTime, durationH: sleepDuration(bedTime, wakeTime),
        quality: (3 + Math.floor(rand() * 3)) as SleepEntry['quality'],
        fatigue: (1 + Math.floor(rand() * 3)) as SleepEntry['fatigue'],
      };
      await upsertDoc('sleep', sleep);

      // Hydratation.
      const hydration: HydrationEntry = {
        id: `hyd-${u.id}-${date}`, userId: u.id, createdAt: createdAt + 3000, date,
        glasses: 5 + Math.floor(rand() * 5),
      };
      await upsertDoc('hydration', hydration);

      // Séances : ~4 / semaine.
      if (rand() > 0.45) {
        const template = templates[Math.floor(rand() * templates.length)];
        const session: Workout = {
          ...template,
          id: uid(),
          isTemplate: false,
          date,
          createdAt: createdAt + 4000,
          completed: true,
          durationMin: 45 + Math.floor(rand() * 30),
          exercises: template.exercises.map((e) => ({
            ...e,
            sets: e.sets.map((s) => ({ ...s, done: true })),
          })),
        };
        await upsertDoc('workouts', session);
      }
    }

    // Habitudes.
    const habits: Omit<Habit, 'id' | 'userId' | 'createdAt'>[] = [
      { name: 'Lecture 20 min', emoji: '📚', targetPerWeek: 5, log: days.filter(() => rand() > 0.35) },
      { name: '10 000 pas', emoji: '🚶', targetPerWeek: 7, log: days.filter(() => rand() > 0.3) },
      { name: 'Méditation', emoji: '🧘', targetPerWeek: 4, log: days.filter(() => rand() > 0.5) },
    ];
    for (const h of habits) {
      await upsertDoc<Habit>('habits', { ...h, id: uid(), userId: u.id, createdAt: Date.now() });
    }

    // Projet exemple.
    const project: Project = {
      id: uid(), userId: u.id, createdAt: Date.now(), shared: true,
      name: 'Transformation été', emoji: '🏆',
      goal: 'Atteindre 10 % de masse grasse et courir 10 km',
      deadline: days[days.length - 1],
      tasks: [
        {
          id: uid(), title: 'Plan nutrition semaine type', status: 'done',
          subtasks: [{ id: uid(), title: 'Calculer macros', done: true }], comments: [],
        },
        {
          id: uid(), title: 'Programme course 3x/semaine', status: 'doing',
          subtasks: [
            { id: uid(), title: 'Semaine 1-2 : 3 km', done: true },
            { id: uid(), title: 'Semaine 3-4 : 5 km', done: false },
          ],
          comments: [{ id: uid(), userId: u.id, text: 'On tient le rythme 💪', at: Date.now() }],
        },
        { id: uid(), title: 'Bilan photos avant/après', status: 'todo', subtasks: [], comments: [] },
      ],
    };
    await upsertDoc('projects', project);
  }

  // Mur de motivation partagé.
  const posts: Array<Pick<Post, 'userId' | 'text'>> = [
    { userId: 'stanne', text: 'Semaine 3 validée 🔥 On ne lâche rien !' },
    { userId: 'tissam', text: 'Nouveau record au squat aujourd’hui 💪 100 kg !' },
    { userId: 'stanne', text: '« La constance bat le talent. » — on continue ensemble.' },
  ];
  for (let i = 0; i < posts.length; i++) {
    await upsertDoc<Post>('posts', {
      id: uid(), userId: posts[i].userId, text: posts[i].text,
      createdAt: Date.now() - (posts.length - i) * 3600_000,
      shared: true,
      reactions: { '🔥': [posts[i].userId === 'stanne' ? 'tissam' : 'stanne'] },
      comments: [],
    });
  }

  await AsyncStorage.setItem(SEED_FLAG, '1');
}
