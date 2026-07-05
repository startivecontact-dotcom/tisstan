import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import { BarChart } from '@/components/charts/BarChart';
import { Card } from '@/components/ui/Card';
import { Ring } from '@/components/ui/Ring';
import { Screen } from '@/components/ui/Screen';
import { GLASS_ML } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useHydration, useUpsert, useUserId } from '@/hooks/useData';
import { useAuth } from '@/stores/auth';
import type { HydrationEntry } from '@/types/models';
import { dayjs, lastNDays, todayISO } from '@/utils/date';

export default function HydrationScreen() {
  const userId = useUserId();
  const profile = useAuth((s) => s.profile);
  const hydration = useHydration(userId);
  const upsert = useUpsert<HydrationEntry>('hydration');

  const today = todayISO();
  const goal = profile?.goals.waterGlasses ?? 8;
  const entry = (hydration.data ?? []).find((h) => h.date === today);
  const glasses = entry?.glasses ?? 0;

  const week = lastNDays(7);
  const weekData = week.map((d) => (hydration.data ?? []).find((h) => h.date === d)?.glasses ?? 0);

  const setGlasses = (n: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    upsert.mutate({
      id: entry?.id ?? `hyd-${userId}-${today}`,
      userId,
      createdAt: entry?.createdAt ?? Date.now(),
      date: today,
      glasses: Math.max(0, n),
    });
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Hydratation</Text>
      </Pressable>

      <Card className="mt-4 items-center py-8">
        <Ring
          value={glasses / Math.max(1, goal)}
          size={180}
          strokeWidth={16}
          color={colors.sky}
          label={`${glasses} / ${goal}`}
          sublabel={`${((glasses * GLASS_ML) / 1000).toFixed(2)} L`}
        />
        <View className="mt-6 flex-row items-center gap-6">
          <Pressable
            onPress={() => setGlasses(glasses - 1)}
            className="h-14 w-14 items-center justify-center rounded-full border border-line bg-surface"
          >
            <Minus size={24} color={colors.ink} />
          </Pressable>
          <Text className="text-4xl">💧</Text>
          <Pressable
            onPress={() => setGlasses(glasses + 1)}
            className="h-14 w-14 items-center justify-center rounded-full bg-sky"
          >
            <Plus size={24} color={colors.bg} />
          </Pressable>
        </View>
        <Text className="mt-4 text-sm text-mute">
          {glasses >= goal ? '🎉 Objectif atteint, bien joué !' : `Encore ${goal - glasses} verre${goal - glasses > 1 ? 's' : ''} (${GLASS_ML} ml chacun)`}
        </Text>
      </Card>

      <Card className="mt-4">
        <Text className="mb-2 text-sm font-semibold text-ink">7 derniers jours</Text>
        <BarChart data={weekData} labels={week.map((d) => dayjs(d).format('dd'))} color={colors.sky} goal={goal} />
      </Card>
    </Screen>
  );
}
