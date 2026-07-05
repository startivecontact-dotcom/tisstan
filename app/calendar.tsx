import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useHabits, useMeals, useSleep, useUserId, useWeights, useWorkouts } from '@/hooks/useData';
import { dayjs, formatLong, monthGrid, todayISO } from '@/utils/date';

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const DOTS = [
  { key: 'workout', color: colors.brand, label: 'Sport' },
  { key: 'meal', color: colors.warn, label: 'Repas' },
  { key: 'sleep', color: colors.violet, label: 'Sommeil' },
  { key: 'weight', color: colors.sky, label: 'Poids' },
  { key: 'habit', color: colors.danger, label: 'Habitudes' },
] as const;

/** Vue calendrier : un point coloré par type d'activité chaque jour. */
export default function CalendarScreen() {
  const userId = useUserId();
  const [month, setMonth] = useState(dayjs());
  const [selected, setSelected] = useState(todayISO());

  const weights = useWeights(userId);
  const meals = useMeals(userId);
  const sleep = useSleep(userId);
  const workouts = useWorkouts(userId);
  const habits = useHabits(userId);

  const activity = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (date: string | undefined, kind: string) => {
      if (!date) return;
      if (!map.has(date)) map.set(date, new Set());
      map.get(date)!.add(kind);
    };
    (weights.data ?? []).forEach((w) => add(w.date, 'weight'));
    (meals.data ?? []).forEach((m) => add(m.date, 'meal'));
    (sleep.data ?? []).forEach((s) => add(s.date, 'sleep'));
    (workouts.data ?? []).filter((w) => !w.isTemplate).forEach((w) => add(w.date, 'workout'));
    (habits.data ?? []).forEach((h) => h.log.forEach((d) => add(d, 'habit')));
    return map;
  }, [weights.data, meals.data, sleep.data, workouts.data, habits.data]);

  const grid = monthGrid(month.year(), month.month());
  const selectedKinds = activity.get(selected) ?? new Set<string>();

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Calendrier</Text>
      </Pressable>

      <Card className="mt-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable className="p-2" onPress={() => setMonth((m) => m.subtract(1, 'month'))}>
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-bold capitalize text-ink">{month.format('MMMM YYYY')}</Text>
          <Pressable className="p-2" onPress={() => setMonth((m) => m.add(1, 'month'))}>
            <ChevronRight size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View className="flex-row">
          {WEEK_DAYS.map((d, i) => (
            <Text key={i} className="flex-1 text-center text-xs font-bold text-mute">{d}</Text>
          ))}
        </View>

        {grid.map((week, wi) => (
          <View key={wi} className="mt-1 flex-row">
            {week.map((date, di) => {
              if (!date) return <View key={di} className="flex-1 p-1" />;
              const kinds = activity.get(date);
              const isSelected = date === selected;
              const isToday = date === todayISO();
              return (
                <Pressable key={di} onPress={() => setSelected(date)} className="flex-1 items-center p-1">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-2xl ${isSelected ? 'bg-brand' : isToday ? 'bg-surface' : ''}`}
                  >
                    <Text className={`text-sm font-semibold ${isSelected ? 'text-bg' : 'text-ink'}`}>
                      {dayjs(date).date()}
                    </Text>
                    <View className="h-1.5 flex-row gap-0.5">
                      {DOTS.filter((d) => kinds?.has(d.key)).slice(0, 4).map((d) => (
                        <View key={d.key} className="h-1 w-1 rounded-full" style={{ backgroundColor: isSelected ? colors.bg : d.color }} />
                      ))}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </Card>

      {/* Légende */}
      <View className="mt-3 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
        {DOTS.map((d) => (
          <View key={d.key} className="flex-row items-center">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            <Text className="ml-1.5 text-xs text-mute">{d.label}</Text>
          </View>
        ))}
      </View>

      {/* Détail du jour sélectionné */}
      <Card className="mt-4">
        <Text className="text-base font-bold capitalize text-ink">{formatLong(selected)}</Text>
        {selectedKinds.size === 0 ? (
          <Text className="mt-2 text-sm text-mute">Aucune activité enregistrée ce jour.</Text>
        ) : (
          <View className="mt-2 gap-1.5">
            {DOTS.filter((d) => selectedKinds.has(d.key)).map((d) => (
              <View key={d.key} className="flex-row items-center">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <Text className="ml-2 text-sm text-ink">{d.label} enregistré ✓</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}
