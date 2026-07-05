import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listDocs, removeDoc, upsertDoc, type CollectionName, type ListQuery } from '@/services/data/repo';
import { useAuth } from '@/stores/auth';
import type {
  BaseDoc,
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

// ------------------------------------------------------------------
// Hooks génériques CRUD (React Query au-dessus du repo).
// ------------------------------------------------------------------

export function useList<T extends BaseDoc>(col: CollectionName, q: ListQuery = {}) {
  return useQuery({
    queryKey: [col, q],
    queryFn: () => listDocs<T>(col, q),
  });
}

export function useUpsert<T extends BaseDoc>(col: CollectionName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docData: T) => upsertDoc(col, docData),
    onSuccess: () => qc.invalidateQueries({ queryKey: [col] }),
  });
}

export function useRemove(col: CollectionName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDoc(col, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [col] }),
  });
}

/** Utilisateur connecté — à n'appeler que derrière le garde d'auth. */
export function useUserId(): UserId {
  const userId = useAuth((s) => s.userId);
  if (!userId) throw new Error('useUserId appelé sans utilisateur connecté');
  return userId;
}

// ------------------------------------------------------------------
// Hooks par fonctionnalité.
// ------------------------------------------------------------------

export const useWeights = (userId: UserId) => useList<WeightEntry>('weight', { userId });
export const useMeals = (userId: UserId, date?: string) => useList<Meal>('meals', { userId, date });
export const useSleep = (userId: UserId) => useList<SleepEntry>('sleep', { userId });
export const useHydration = (userId: UserId) => useList<HydrationEntry>('hydration', { userId });
export const useWorkouts = (userId: UserId) => useList<Workout>('workouts', { userId });
export const useHabits = (userId: UserId) => useList<Habit>('habits', { userId });
export const useProjects = (userId: UserId) => useList<Project>('projects', { userId, includeShared: true });
export const usePosts = (userId: UserId) => useList<Post>('posts', { userId, includeShared: true });
