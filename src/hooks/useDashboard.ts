import { useMemo } from 'react';
import type { CoachContext } from '@/services/ai';
import { useAuth } from '@/stores/auth';
import { defaultProfile } from '@/services/data/profiles';
import type { UserId } from '@/types/models';
import { dayjs, lastNDays, todayISO } from '@/utils/date';
import { totalsOfMeals } from '@/utils/nutrition';
import { dayScore } from '@/utils/score';
import { currentStreak, bestStreak } from '@/utils/streak';
import { earnedBadges, levelForXp, levelProgress, totalXp } from '@/utils/gamification';
import {
  useHabits,
  useHydration,
  useMeals,
  useSleep,
  useWeights,
  useWorkouts,
} from '@/hooks/useData';

/**
 * Agrège toutes les données du jour d'un utilisateur : score, macros,
 * streak, XP, contexte IA… Utilisé par le dashboard, les stats et le coach.
 */
export function useDaySummary(userId: UserId, date = todayISO()) {
  const profileFromStore = useAuth((s) => s.profile);
  const weights = useWeights(userId);
  const meals = useMeals(userId);
  const sleep = useSleep(userId);
  const hydration = useHydration(userId);
  const workouts = useWorkouts(userId);
  const habits = useHabits(userId);

  const profile =
    profileFromStore && profileFromStore.id === userId ? profileFromStore : defaultProfile(userId);

  const loading =
    weights.isLoading || meals.isLoading || sleep.isLoading || hydration.isLoading ||
    workouts.isLoading || habits.isLoading;

  return useMemo(() => {
    const allMeals = meals.data ?? [];
    const todayMeals = allMeals.filter((m) => m.date === date);
    const totals = totalsOfMeals(todayMeals);

    const allWeights = [...(weights.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    const latestWeight = allWeights[0];

    const sleepEntries = [...(sleep.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    const lastSleep = sleepEntries.find((s) => s.date === date) ?? sleepEntries[0];

    const hydrationToday = (hydration.data ?? []).find((h) => h.date === date);
    const glasses = hydrationToday?.glasses ?? 0;

    const sessions = (workouts.data ?? []).filter((w) => !w.isTemplate && w.date);
    const weekStart = dayjs(date).subtract(6, 'day').format('YYYY-MM-DD');
    const weekWorkouts = sessions.filter((w) => w.date! >= weekStart && w.date! <= date);
    const workoutToday = sessions.some((w) => w.date === date && w.completed);

    const activeHabits = (habits.data ?? []).filter((h) => !h.archived);
    const habitsDone = activeHabits.filter((h) => h.log.includes(date)).length;

    // Jours "actifs" (au moins un log) → streak global.
    const activeDates = new Set<string>();
    for (const m of allMeals) activeDates.add(m.date);
    for (const w of allWeights) activeDates.add(w.date);
    for (const s of sessions) if (s.date) activeDates.add(s.date);
    for (const h of activeHabits) h.log.forEach((d) => activeDates.add(d));
    const streak = currentStreak([...activeDates]);
    const best = bestStreak([...activeDates]);

    const score = dayScore(
      {
        calories: totals.calories,
        proteinG: totals.proteinG,
        waterGlasses: glasses,
        sleepHours: lastSleep?.date === date ? lastSleep.durationH : 0,
        workoutDone: workoutToday,
        habitsDone,
        habitsTotal: activeHabits.length,
      },
      profile.goals,
    );

    const xp = totalXp({
      weighIns: allWeights.length,
      meals: allMeals.length,
      workouts: sessions.filter((w) => w.completed).length,
      sleepLogs: sleepEntries.length,
      hydrationDays: (hydration.data ?? []).filter((h) => h.glasses >= profile.goals.waterGlasses).length,
      habitChecks: activeHabits.reduce((a, h) => a + h.log.length, 0),
      posts: 0,
      bestStreak: best,
    });

    const coachContext: CoachContext = {
      profile,
      lastWeights: allWeights,
      todayMeals,
      lastSleep,
      recentWorkouts: weekWorkouts,
    };

    // Séries de 7 jours pour les mini-graphiques du dashboard.
    const week = lastNDays(7, dayjs(date));
    const weekCalories = week.map((d) => totalsOfMeals(allMeals.filter((m) => m.date === d)).calories);
    const weekSleep = week.map((d) => sleepEntries.find((s) => s.date === d)?.durationH ?? 0);
    const weekWater = week.map((d) => (hydration.data ?? []).find((h) => h.date === d)?.glasses ?? 0);

    return {
      loading,
      profile,
      totals,
      todayMeals,
      latestWeight,
      allWeights,
      lastSleep,
      sleepEntries,
      glasses,
      weekWorkouts,
      workoutToday,
      activeHabits,
      habitsDone,
      streak,
      bestStreakDays: best,
      score,
      xp,
      level: levelForXp(xp),
      levelPct: levelProgress(xp),
      badges: earnedBadges(xp),
      coachContext,
      week,
      weekCalories,
      weekSleep,
      weekWater,
    };
  }, [
    loading, date, profile,
    weights.data, meals.data, sleep.data, hydration.data, workouts.data, habits.data,
  ]);
}
