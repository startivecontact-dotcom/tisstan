import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Moon, Sparkles } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { BarChart } from '@/components/charts/BarChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors } from '@/constants/theme';
import { useSleep, useUpsert, useUserId } from '@/hooks/useData';
import { useAuth } from '@/stores/auth';
import { sleepAdvice } from '@/services/ai';
import type { SleepEntry } from '@/types/models';
import { dayjs, formatDay, lastNDays, sleepDuration, todayISO } from '@/utils/date';
import { uid } from '@/utils/id';

interface SleepForm {
  bedTime: string;
  wakeTime: string;
}

const STARS = [1, 2, 3, 4, 5] as const;

export default function SleepScreen() {
  const userId = useUserId();
  const profile = useAuth((s) => s.profile);
  const sleep = useSleep(userId);
  const upsert = useUpsert<SleepEntry>('sleep');
  const [quality, setQuality] = useState<SleepEntry['quality']>(4);
  const [fatigue, setFatigue] = useState<SleepEntry['fatigue']>(2);
  const [advice, setAdvice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit } = useForm<SleepForm>({ defaultValues: { bedTime: '23:00', wakeTime: '07:00' } });

  const entries = [...(sleep.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const week = lastNDays(7);
  const weekData = week.map((d) => entries.find((e) => e.date === d)?.durationH ?? 0);
  const avg = entries.slice(0, 7).length
    ? entries.slice(0, 7).reduce((a, e) => a + e.durationH, 0) / entries.slice(0, 7).length
    : 0;

  const save = handleSubmit(async (v) => {
    if (!/^\d{1,2}:\d{2}$/.test(v.bedTime) || !/^\d{1,2}:\d{2}$/.test(v.wakeTime)) return;
    setSaving(true);
    try {
      const entry: SleepEntry = {
        id: uid(), userId, createdAt: Date.now(), date: todayISO(),
        bedTime: v.bedTime, wakeTime: v.wakeTime,
        durationH: sleepDuration(v.bedTime, v.wakeTime),
        quality, fatigue,
      };
      await upsert.mutateAsync(entry);
      if (profile) setAdvice(await sleepAdvice([entry, ...entries], profile.goals));
    } finally {
      setSaving(false);
    }
  });

  return (
    <Screen refreshing={sleep.isRefetching} onRefresh={() => sleep.refetch()}>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Sommeil</Text>
      </Pressable>

      <View className="mt-3 flex-row gap-3">
        <Card className="flex-1 items-center">
          <Moon size={20} color={colors.violet} />
          <Text className="mt-1 text-2xl font-bold text-ink">{entries[0]?.durationH ?? '—'} h</Text>
          <Text className="text-xs text-mute">Dernière nuit</Text>
        </Card>
        <Card className="flex-1 items-center">
          <Text className="text-xl">📊</Text>
          <Text className="mt-1 text-2xl font-bold text-ink">{avg ? avg.toFixed(1) : '—'} h</Text>
          <Text className="text-xs text-mute">Moyenne 7 j</Text>
        </Card>
        <Card className="flex-1 items-center">
          <Text className="text-xl">🎯</Text>
          <Text className="mt-1 text-2xl font-bold text-brand">{profile?.goals.sleepHours ?? 8} h</Text>
          <Text className="text-xs text-mute">Objectif</Text>
        </Card>
      </View>

      <Card className="mt-3">
        <Text className="mb-2 text-sm font-semibold text-ink">7 dernières nuits</Text>
        <BarChart
          data={weekData}
          labels={week.map((d) => dayjs(d).format('dd'))}
          color={colors.violet}
          goal={profile?.goals.sleepHours}
        />
      </Card>

      <Card className="mt-3">
        <Text className="mb-3 text-base font-bold text-ink">Nuit dernière</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormInput control={control} name="bedTime" label="Coucher" placeholder="23:00" rules={{ required: true }} />
          </View>
          <View className="flex-1">
            <FormInput control={control} name="wakeTime" label="Réveil" placeholder="07:00" rules={{ required: true }} />
          </View>
        </View>
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-mute">Qualité</Text>
        <View className="mb-3 flex-row gap-2">
          {STARS.map((n) => (
            <Pressable key={n} onPress={() => setQuality(n)}>
              <Text className={`text-2xl ${n <= quality ? '' : 'opacity-25'}`}>⭐</Text>
            </Pressable>
          ))}
        </View>
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-mute">Fatigue au réveil</Text>
        <View className="mb-4 flex-row gap-2">
          {STARS.map((n) => (
            <Pressable key={n} onPress={() => setFatigue(n)}>
              <Text className={`text-2xl ${n <= fatigue ? '' : 'opacity-25'}`}>🥱</Text>
            </Pressable>
          ))}
        </View>
        <Button title="Enregistrer la nuit" onPress={save} loading={saving} />
        {advice ? (
          <View className="mt-3 flex-row rounded-2xl border border-violet/25 bg-violet/5 p-3">
            <Sparkles size={16} color={colors.violet} />
            <Text className="ml-2 flex-1 text-sm leading-5 text-ink">{advice}</Text>
          </View>
        ) : null}
      </Card>

      <SectionTitle title="Historique" />
      <Card>
        {entries.slice(0, 10).map((e) => (
          <View key={e.id} className="flex-row items-center justify-between border-b border-line py-2.5">
            <Text className="capitalize text-ink">{formatDay(e.date)}</Text>
            <Text className="text-sm text-mute">
              {e.bedTime} → {e.wakeTime} · <Text className="font-bold text-ink">{e.durationH} h</Text> · {'⭐'.repeat(e.quality)}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
