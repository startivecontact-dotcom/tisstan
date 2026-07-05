import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors } from '@/constants/theme';
import { useDaySummary } from '@/hooks/useDashboard';
import { useHabits, useUserId, useWorkouts } from '@/hooks/useData';
import { dayjs, lastNDays } from '@/utils/date';

export default function StatsScreen() {
  const userId = useUserId();
  const s = useDaySummary(userId);
  const workouts = useWorkouts(userId);
  const habits = useHabits(userId);

  const days14 = lastNDays(14);
  const weightSeries = days14
    .map((d) => s.allWeights.find((w) => w.date === d)?.weightKg)
    .filter((v): v is number => v != null);

  const sessions = (workouts.data ?? []).filter((w) => !w.isTemplate && w.completed && w.date);
  const weeks4 = [3, 2, 1, 0].map((offset) => {
    const start = dayjs().subtract(offset, 'week').startOf('week');
    const end = start.add(6, 'day');
    return sessions.filter((w) => {
      const d = dayjs(w.date);
      return (d.isAfter(start) || d.isSame(start, 'day')) && (d.isBefore(end) || d.isSame(end, 'day'));
    }).length;
  });

  const habitRate = days14.map((d) => {
    const active = (habits.data ?? []).filter((h) => !h.archived);
    if (active.length === 0) return 0;
    return (active.filter((h) => h.log.includes(d)).length / active.length) * 100;
  });

  const labels7 = s.week.map((d) => dayjs(d).format('dd'));

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Statistiques</Text>
      </Pressable>

      {/* Vue d'ensemble */}
      <View className="mt-3 flex-row gap-3">
        <Card className="flex-1 items-center">
          <Text className="text-2xl font-bold text-brand">{s.score}</Text>
          <Text className="text-xs text-mute">Score du jour</Text>
        </Card>
        <Card className="flex-1 items-center">
          <Text className="text-2xl font-bold text-warn">{s.streak}</Text>
          <Text className="text-xs text-mute">Streak (jours)</Text>
        </Card>
        <Card className="flex-1 items-center">
          <Text className="text-2xl font-bold text-sky">{s.xp}</Text>
          <Text className="text-xs text-mute">XP total</Text>
        </Card>
      </View>

      <SectionTitle title="Poids (14 jours)" />
      <Card>
        <LineChart data={weightSeries} goal={s.profile.goals.weightKg} color={colors.brand} formatValue={(v) => `${v} kg`} />
      </Card>

      <SectionTitle title="Calories (7 jours)" />
      <Card>
        <BarChart data={s.weekCalories} labels={labels7} color={colors.warn} goal={s.profile.goals.calories * 0.75} />
      </Card>

      <SectionTitle title="Sommeil (7 jours)" />
      <Card>
        <BarChart data={s.weekSleep} labels={labels7} color={colors.violet} goal={s.profile.goals.sleepHours} />
      </Card>

      <SectionTitle title="Hydratation (7 jours)" />
      <Card>
        <BarChart data={s.weekWater} labels={labels7} color={colors.sky} goal={s.profile.goals.waterGlasses} />
      </Card>

      <SectionTitle title="Séances par semaine" />
      <Card>
        <BarChart data={weeks4} labels={['S-3', 'S-2', 'S-1', 'Actuelle']} color={colors.brand} goal={s.profile.goals.workoutsPerWeek} height={100} />
      </Card>

      <SectionTitle title="Habitudes — % complété (14 jours)" />
      <Card>
        <LineChart data={habitRate} color={colors.danger} formatValue={(v) => `${Math.round(v)}%`} height={120} />
      </Card>
    </Screen>
  );
}
