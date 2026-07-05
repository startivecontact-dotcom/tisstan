import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Crown } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { USERS } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useDaySummary } from '@/hooks/useDashboard';
import { useUserId } from '@/hooks/useData';
import { otherUser } from '@/stores/auth';
import { BADGES, challengeOfDay, xpForLevel } from '@/utils/gamification';
import { todayISO } from '@/utils/date';

/** Succès, badges, défis et classement Stanne vs Tissam. */
export default function AchievementsScreen() {
  const userId = useUserId();
  const rivalId = otherUser(userId);
  const me = useDaySummary(userId);
  const rival = useDaySummary(rivalId);
  const today = todayISO();

  const ranking = [
    { id: userId, xp: me.xp, streak: me.streak, level: me.level },
    { id: rivalId, xp: rival.xp, streak: rival.streak, level: rival.level },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Succès</Text>
      </Pressable>

      {/* Niveau */}
      <Card className="mt-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Niveau</Text>
            <Text className="text-4xl font-bold text-ink">{me.level}</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-brand">{me.xp} XP</Text>
            <Text className="text-xs text-mute">prochain niveau à {xpForLevel(me.level + 1)} XP</Text>
          </View>
        </View>
        <View className="mt-3">
          <ProgressBar value={me.levelPct} />
        </View>
      </Card>

      {/* Classement */}
      <SectionTitle title="Classement Stanne vs Tissam" />
      {ranking.map((r, i) => (
        <Card key={r.id} className={`mb-3 flex-row items-center ${i === 0 ? 'border-warn/40' : ''}`}>
          <Text className="w-8 text-2xl font-bold text-mute">{i + 1}</Text>
          <Avatar profile={USERS[r.id]} size={44} />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-ink">{USERS[r.id].name}</Text>
              {i === 0 ? <Crown size={16} color={colors.warn} style={{ marginLeft: 6 }} /> : null}
            </View>
            <Text className="text-xs text-mute">Niveau {r.level} · streak {r.streak} j</Text>
          </View>
          <Text className="text-lg font-bold text-brand">{r.xp} XP</Text>
        </Card>
      ))}

      {/* Défis */}
      <SectionTitle title="Défis" />
      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Défi du jour</Text>
          <Text className="mt-2 text-2xl">{challengeOfDay(today, userId === 'stanne' ? 1 : 2).emoji}</Text>
          <Text className="mt-1 text-sm font-semibold leading-5 text-ink">
            {challengeOfDay(today, userId === 'stanne' ? 1 : 2).text}
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Défi de la semaine</Text>
          <Text className="mt-2 text-2xl">🏋️</Text>
          <Text className="mt-1 text-sm font-semibold leading-5 text-ink">
            Complète {me.profile.goals.workoutsPerWeek} séances ({me.weekWorkouts.length}/{me.profile.goals.workoutsPerWeek})
          </Text>
          <View className="mt-2">
            <ProgressBar value={me.weekWorkouts.length / Math.max(1, me.profile.goals.workoutsPerWeek)} height={5} />
          </View>
        </Card>
      </View>

      {/* Badges */}
      <SectionTitle title="Badges" />
      <View className="flex-row flex-wrap justify-between">
        {BADGES.map((b) => {
          const earned = me.xp >= b.xp;
          return (
            <Card key={b.id} className={`mb-3 w-[48.5%] items-center py-5 ${earned ? '' : 'opacity-40'}`}>
              <Text className="text-4xl">{b.emoji}</Text>
              <Text className="mt-2 font-bold text-ink">{b.name}</Text>
              <Text className="mt-0.5 text-center text-xs text-mute">{b.description}</Text>
              <Text className={`mt-2 text-xs font-bold ${earned ? 'text-brand' : 'text-mute'}`}>
                {earned ? 'Débloqué ✓' : `${b.xp - me.xp} XP restants`}
              </Text>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
