import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, ChevronLeft, Flame, Plus, Trash2, X } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormInput } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useHabits, useRemove, useUpsert, useUserId } from '@/hooks/useData';
import type { Habit } from '@/types/models';
import { dayjs, lastNDays, todayISO } from '@/utils/date';
import { uid } from '@/utils/id';
import { currentStreak } from '@/utils/streak';

interface HabitForm {
  name: string;
  emoji: string;
  targetPerWeek: string;
}

export default function HabitsScreen() {
  const userId = useUserId();
  const habits = useHabits(userId);
  const upsert = useUpsert<Habit>('habits');
  const remove = useRemove('habits');
  const [creating, setCreating] = useState(false);
  const { control, handleSubmit, reset } = useForm<HabitForm>({
    defaultValues: { name: '', emoji: '✅', targetPerWeek: '7' },
  });

  const today = todayISO();
  const week = lastNDays(7);
  const active = (habits.data ?? []).filter((h) => !h.archived);

  const toggle = (habit: Habit, date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const log = habit.log.includes(date) ? habit.log.filter((d) => d !== date) : [...habit.log, date];
    upsert.mutate({ ...habit, log });
  };

  const create = handleSubmit(async (v) => {
    await upsert.mutateAsync({
      id: uid(), userId, createdAt: Date.now(),
      name: v.name, emoji: v.emoji || '✅',
      targetPerWeek: Math.min(7, Math.max(1, Number(v.targetPerWeek) || 7)),
      log: [],
    });
    reset();
    setCreating(false);
  });

  return (
    <Screen refreshing={habits.isRefetching} onRefresh={() => habits.refetch()}>
      <View className="mt-2 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="flex-row items-center py-2 pr-4">
          <ChevronLeft size={22} color={colors.ink} />
          <Text className="text-2xl font-bold text-ink">Habitudes</Text>
        </Pressable>
        <Pressable onPress={() => setCreating((c) => !c)} className="h-11 w-11 items-center justify-center rounded-full bg-brand">
          {creating ? <X size={22} color={colors.bg} /> : <Plus size={22} color={colors.bg} />}
        </Pressable>
      </View>

      {creating ? (
        <Card className="mt-4">
          <FormInput control={control} name="name" label="Habitude" placeholder="Lire 20 minutes" rules={{ required: 'Nom requis' }} />
          <View className="flex-row gap-3">
            <View className="flex-1"><FormInput control={control} name="emoji" label="Emoji" placeholder="📚" /></View>
            <View className="flex-1"><FormInput control={control} name="targetPerWeek" label="Fois / semaine" placeholder="7" keyboardType="number-pad" /></View>
          </View>
          <Button title="Créer l’habitude" onPress={create} />
        </Card>
      ) : null}

      {active.length === 0 && !creating ? (
        <EmptyState emoji="🌱" title="Aucune habitude" subtitle="Les petites actions répétées construisent les grands résultats." />
      ) : (
        active.map((h) => {
          const streak = currentStreak(h.log);
          const weekCount = h.log.filter((d) => week.includes(d)).length;
          const doneToday = h.log.includes(today);
          return (
            <Card key={h.id} className="mt-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <Text className="text-2xl">{h.emoji}</Text>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-ink">{h.name}</Text>
                    <View className="mt-0.5 flex-row items-center gap-3">
                      <View className="flex-row items-center">
                        <Flame size={12} color={colors.warn} />
                        <Text className="ml-1 text-xs text-mute">{streak} j</Text>
                      </View>
                      <Text className="text-xs text-mute">{weekCount}/{h.targetPerWeek} cette semaine</Text>
                    </View>
                  </View>
                </View>
                <Pressable onPress={() => remove.mutate(h.id)} className="p-2">
                  <Trash2 size={15} color={colors.mute} />
                </Pressable>
                <Pressable
                  onPress={() => toggle(h, today)}
                  className={`h-11 w-11 items-center justify-center rounded-full ${doneToday ? 'bg-brand' : 'border-2 border-line bg-surface'}`}
                >
                  {doneToday ? <Check size={22} color={colors.bg} /> : null}
                </Pressable>
              </View>
              {/* Semaine en un coup d'œil */}
              <View className="mt-3 flex-row justify-between">
                {week.map((d) => {
                  const done = h.log.includes(d);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => toggle(h, d)}
                      className={`h-9 w-9 items-center justify-center rounded-xl ${done ? 'bg-brand/25' : 'bg-surface'}`}
                    >
                      <Text className={`text-[10px] font-bold ${done ? 'text-brand' : 'text-mute'}`}>
                        {dayjs(d).format('dd').toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
