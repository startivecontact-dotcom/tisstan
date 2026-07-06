/** Identifiants des deux utilisateurs de l'application. */
export type UserId = 'stanne' | 'tissam';

/** Date au format ISO court : YYYY-MM-DD. */
export type DateISO = string;

export interface Goals {
  weightKg: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterGlasses: number;
  sleepHours: number;
  workoutsPerWeek: number;
  stepsPerDay: number;
}

export interface UserProfile {
  id: UserId;
  name: string;
  emoji: string;
  color: string;
  photoUrl: string | null;
  goals: Goals;
  heightCm?: number;
  sex?: 'male' | 'female';
  birthYear?: number;
  /** L'onboarding de première utilisation a été complété. */
  onboarded?: boolean;
}

/** Document de base : toutes les entités stockées héritent de ces champs. */
export interface BaseDoc {
  id: string;
  userId: UserId;
  createdAt: number;
  /** Visible par l'autre utilisateur ? */
  shared?: boolean;
}

// ---------------------------------------------------------------- Poids

export interface WeightEntry extends BaseDoc {
  date: DateISO;
  weightKg: number;
  note?: string;
  aiComment?: string;
}

// ---------------------------------------------------------------- Nutrition

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
}

export interface Meal extends BaseDoc {
  date: DateISO;
  type: MealType;
  foods: FoodItem[];
  photoUrl?: string | null;
  aiAnalysis?: string;
}

// ---------------------------------------------------------------- Sommeil

export interface SleepEntry extends BaseDoc {
  date: DateISO;
  bedTime: string; // "23:15"
  wakeTime: string; // "07:00"
  durationH: number;
  quality: 1 | 2 | 3 | 4 | 5;
  fatigue: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

// ---------------------------------------------------------------- Hydratation

export interface HydrationEntry extends BaseDoc {
  date: DateISO;
  glasses: number;
}

// ---------------------------------------------------------------- Sport

export interface ExerciseSet {
  reps: number;
  weightKg: number;
  done?: boolean;
}

export interface Exercise {
  name: string;
  sets: ExerciseSet[];
  restSec: number;
}

export interface Workout extends BaseDoc {
  name: string;
  exercises: Exercise[];
  /** Programme réutilisable (template) ou séance datée. */
  isTemplate: boolean;
  date?: DateISO;
  durationMin?: number;
  completed?: boolean;
}

export interface PersonalRecord {
  exercise: string;
  weightKg: number;
  reps: number;
  date: DateISO;
}

// ---------------------------------------------------------------- Habitudes

export interface Habit extends BaseDoc {
  name: string;
  emoji: string;
  targetPerWeek: number;
  /** Dates cochées. */
  log: DateISO[];
  archived?: boolean;
}

// ---------------------------------------------------------------- Projets

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  deadline?: DateISO;
  subtasks: { id: string; title: string; done: boolean }[];
  comments: { id: string; userId: UserId; text: string; at: number }[];
}

export interface Project extends BaseDoc {
  name: string;
  emoji: string;
  goal: string;
  deadline?: DateISO;
  tasks: ProjectTask[];
}

// ---------------------------------------------------------------- Motivation (mur privé)

export type Reaction = '❤️' | '🔥' | '💪';

export interface Post extends BaseDoc {
  text: string;
  photoUrl?: string | null;
  reactions: Partial<Record<Reaction, UserId[]>>;
  comments: { id: string; userId: UserId; text: string; at: number }[];
}

// ---------------------------------------------------------------- Photos

export type PhotoKind = 'before-after' | 'meal' | 'motivation' | 'workout';

export interface PhotoDoc extends BaseDoc {
  kind: PhotoKind;
  url: string;
  caption?: string;
  date: DateISO;
}

// ---------------------------------------------------------------- IA

export interface AiMessage extends BaseDoc {
  role: 'user' | 'assistant';
  text: string;
}

// ---------------------------------------------------------------- Gamification

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Seuil d'XP ou prédicat spécifique géré dans utils/gamification. */
  xp: number;
}
