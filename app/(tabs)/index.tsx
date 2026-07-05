import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Droplets, Flame, Moon, Scale } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BarChart } from '@/components/charts/BarChart';
import { MacroRow } from '@/components/MacroRow';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Ring } from '@/components/ui/Ring';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { quoteOfDay } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useDaySummary } from '@/hooks/useDashboard';
import { useUserId } from '@/hooks/useData';
import { dailyInsight } from '@/services/ai';
import { challengeOfDay } from '@/utils/gamification';
import { dayjs, formatLong, todayISO } from '@/utils/date';
import { scoreLabel } from '@/utils/score';

export default function DashboardScreen() {
  const userId = useUserId();
  const today = todayISO();
  const s = useDaySummary(userId);
  const challenge = challengeOfDay(today, userId === 'stanne' ? 1 : 2);

  return (
    <Screen>
      {/* En-tête */}
      <Animated.View entering={FadeInDown.duration(500)} className="mt-2 flex-row items-center justify-between">
        <View>
          <Text className="text-sm capitalize text-mute">{formatLong(today)}</Text>
          <Text className="text-3xl font-bold tracking-tight text-ink">Salut {s.profile.name} 👋</Text>
        </View>
        <Pressable onPress={() => router.push('/profile')}>
          <Avatar profile={s.profile} size={48} />
        </Pressable>
      </Animated.View>

      {/* Score du jour + anneaux */}
      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Card className="mt-5">
          <View className="flex-row items-center justify-between">
            <Ring value={s.score / 100} size={132} strokeWidth={13} label={`${s.score}`} sublabel={scoreLabel(s.score)} />
            <View className="ml-4 flex-1 gap-4">
              <Ring
                value={s.profile.goals.calories ? s.totals.calories / s.profile.goals.calories : 0}
                size={58} strokeWidth={7} color={colors.warn}
                label={`${Math.round((s.totals.calories / Math.max(1, s.profile.goals.calories)) * 100)}%`}
              />
              <View className="flex-row gap-4">
                <Ring
                  value={s.glasses / Math.max(1, s.profile.goals.waterGlasses)}
                  size={58} strokeWidth={7} color={colors.sky}
                  label={`${s.glasses}`}
                />
                <Ring
                  value={(s.lastSleep?.date === today ? s.lastSleep.durationH : 0) / Math.max(1, s.profile.goals.sleepHours)}
                  size={58} strokeWidth={7} color={colors.violet}
                  label={s.lastSleep?.date === today ? `${s.lastSleep.durationH}h` : '—'}
                />
              </View>
            </View>
          </View>
          <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-surface p-3">
            <View className="flex-row items-center">
              <Flame size={18} color={colors.warn} />
              <Text className="ml-2 font-semibold text-ink">Streak : {s.streak} jour{s.streak > 1 ? 's' : ''}</Text>
            </View>
            <Text className="text-xs text-mute">record {s.bestStreakDays} j</Text>
          </View>
        </Card>
      </Animated.View>

      {/* IA du jour + citation */}
      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <Card className="mt-4 border-brand/30 bg-brand/5" onPress={() => router.push('/(tabs)/coach')}>
          <Text className="text-xs font-semibold uppercase tracking-widest text-brand">Coach IA du jour</Text>
          <Text className="mt-1.5 text-base leading-6 text-ink">{dailyInsight(s.coachContext)}</Text>
        </Card>
        <Text className="mt-4 px-2 text-center text-sm italic text-mute">« {quoteOfDay(today)} »</Text>
      </Animated.View>

      {/* Tuiles rapides */}
      <Animated.View entering={FadeInDown.delay(240).duration(500)} className="mt-5 flex-row gap-3">
        <Card className="flex-1" onPress={() => router.push('/weight')}>
          <Scale size={20} color={colors.brand} />
          <Text className="mt-2 text-2xl font-bold text-ink">
            {s.latestWeight ? `${s.latestWeight.weightKg}` : '—'}
            <Text className="text-sm font-semibold text-mute"> kg</Text>
          </Text>
          <Text className="text-xs text-mute">Objectif {s.profile.goals.weightKg} kg</Text>
        </Card>
        <Card className="flex-1" onPress={() => router.push('/hydration')}>
          <Droplets size={20} color={colors.sky} />
          <Text className="mt-2 text-2xl font-bold text-ink">
            {s.glasses}<Text className="text-sm font-semibold text-mute"> / {s.profile.goals.waterGlasses}</Text>
          </Text>
          <Text className="text-xs text-mute">Verres d’eau</Text>
        </Card>
        <Card className="flex-1" onPress={() => router.push('/sleep')}>
          <Moon size={20} color={colors.violet} />
          <Text className="mt-2 text-2xl font-bold text-ink">
            {s.lastSleep ? `${s.lastSleep.durationH}` : '—'}
            <Text className="text-sm font-semibold text-mute"> h</Text>
          </Text>
          <Text className="text-xs text-mute">Sommeil</Text>
        </Card>
      </Animated.View>

      {/* Nutrition du jour */}
      <SectionTitle title="Nutrition du jour" action="Détails" onAction={() => router.push('/(tabs)/nutrition')} />
      <Card>
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="text-2xl font-bold text-ink">{Math.round(s.totals.calories)} kcal</Text>
          <Text className="text-sm text-mute">/ {s.profile.goals.calories} kcal</Text>
        </View>
        <ProgressBar value={s.totals.calories / Math.max(1, s.profile.goals.calories)} color={colors.warn} />
        <View className="mt-4">
          <MacroRow totals={s.totals} goals={s.profile.goals} />
        </View>
      </Card>

      {/* Semaine : sport + calories */}
      <SectionTitle title="Cette semaine" action="Stats" onAction={() => router.push('/stats')} />
      <Card>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-sm font-semibold text-ink">Calories (7 jours)</Text>
          <Text className="text-xs text-mute">
            {s.weekWorkouts.length} séance{s.weekWorkouts.length > 1 ? 's' : ''} / obj. {s.profile.goals.workoutsPerWeek}
          </Text>
        </View>
        <BarChart
          data={s.weekCalories}
          labels={s.week.map((d) => dayjs(d).format('dd'))}
          color={colors.warn}
          goal={s.profile.goals.calories * 0.75}
        />
      </Card>

      {/* Défi + niveau */}
      <SectionTitle title="Gamification" action="Succès" onAction={() => router.push('/achievements')} />
      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-2xl">{challenge.emoji}</Text>
          <Text className="mt-1 text-xs font-semibold uppercase tracking-widest text-mute">Défi du jour</Text>
          <Text className="mt-1 text-sm font-semibold leading-5 text-ink">{challenge.text}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-2xl">🏅</Text>
          <Text className="mt-1 text-xs font-semibold uppercase tracking-widest text-mute">Niveau {s.level}</Text>
          <Text className="mt-1 text-sm font-semibold text-ink">{s.xp} XP</Text>
          <View className="mt-2">
            <ProgressBar value={s.levelPct} color={colors.brand} height={6} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
