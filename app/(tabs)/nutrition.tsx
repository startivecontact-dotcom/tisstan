import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Trash2 } from 'lucide-react-native';
import { MacroRow } from '@/components/MacroRow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors } from '@/constants/theme';
import { useMeals, useRemove, useUpsert, useUserId } from '@/hooks/useData';
import { useAuth } from '@/stores/auth';
import { analyzeMeal } from '@/services/ai';
import type { Meal } from '@/types/models';
import { dayjs, formatDay, todayISO } from '@/utils/date';
import { MEAL_LABELS, totalsOfFoods, totalsOfMeals } from '@/utils/nutrition';

export default function NutritionScreen() {
  const userId = useUserId();
  const profile = useAuth((s) => s.profile);
  const [date, setDate] = useState(todayISO());
  const meals = useMeals(userId, date);
  const upsertMeal = useUpsert<Meal>('meals');
  const removeMeal = useRemove('meals');
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const goals = profile?.goals;
  const dayMeals = meals.data ?? [];
  const totals = totalsOfMeals(dayMeals);

  const runAnalysis = async (meal: Meal) => {
    if (!goals) return;
    setAnalyzing(meal.id);
    try {
      const aiAnalysis = await analyzeMeal(meal, goals);
      await upsertMeal.mutateAsync({ ...meal, aiAnalysis });
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <Screen refreshing={meals.isRefetching} onRefresh={() => meals.refetch()}>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-3xl font-bold tracking-tight text-ink">Nutrition</Text>
        <Pressable
          onPress={() => router.push({ pathname: '/meal-add', params: { date } })}
          className="h-11 w-11 items-center justify-center rounded-full bg-brand"
        >
          <Plus size={22} color={colors.bg} />
        </Pressable>
      </View>

      {/* Sélecteur de jour */}
      <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-surface p-2">
        <Pressable className="p-2" onPress={() => setDate(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))}>
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Text className="font-semibold capitalize text-ink">
          {date === todayISO() ? "Aujourd'hui" : formatDay(date)}
        </Text>
        <Pressable
          className="p-2"
          disabled={date >= todayISO()}
          onPress={() => setDate(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))}
        >
          <ChevronRight size={20} color={date >= todayISO() ? colors.line : colors.ink} />
        </Pressable>
      </View>

      {/* Résumé du jour */}
      {goals ? (
        <Card className="mt-4">
          <View className="mb-2 flex-row items-baseline justify-between">
            <Text className="text-2xl font-bold text-ink">{Math.round(totals.calories)} kcal</Text>
            <Text className="text-sm text-mute">/ {goals.calories} kcal</Text>
          </View>
          <ProgressBar value={totals.calories / Math.max(1, goals.calories)} color={colors.warn} />
          <View className="mt-4">
            <MacroRow totals={totals} goals={goals} />
          </View>
          <View className="mt-4 flex-row justify-between rounded-2xl bg-surface p-3">
            <Text className="text-xs text-mute">Fibres {Math.round(totals.fiberG)} g</Text>
            <Text className="text-xs text-mute">Sucre {Math.round(totals.sugarG)} g</Text>
            <Text className="text-xs text-mute">Sodium {Math.round(totals.sodiumMg)} mg</Text>
          </View>
        </Card>
      ) : null}

      <SectionTitle title="Repas" />
      {dayMeals.length === 0 ? (
        <EmptyState emoji="🍽️" title="Aucun repas ce jour" subtitle="Appuie sur + pour ajouter un repas ou scanner une photo." />
      ) : (
        [...dayMeals]
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((meal) => {
            const t = totalsOfFoods(meal.foods);
            const label = MEAL_LABELS[meal.type];
            return (
              <Card key={meal.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-ink">
                    {label.emoji} {label.label}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-sm font-semibold text-warn">{Math.round(t.calories)} kcal</Text>
                    <Pressable onPress={() => removeMeal.mutate(meal.id)}>
                      <Trash2 size={16} color={colors.mute} />
                    </Pressable>
                  </View>
                </View>
                {meal.foods.map((f, i) => (
                  <View key={i} className="mt-2 flex-row justify-between">
                    <Text className="flex-1 text-sm text-ink">{f.name} <Text className="text-mute">· {f.quantity}</Text></Text>
                    <Text className="text-xs text-mute">
                      {Math.round(f.proteinG)}P / {Math.round(f.carbsG)}G / {Math.round(f.fatG)}L
                    </Text>
                  </View>
                ))}
                {meal.aiAnalysis ? (
                  <View className="mt-3 rounded-2xl border border-brand/25 bg-brand/5 p-3">
                    <Text className="text-sm leading-5 text-ink">✨ {meal.aiAnalysis}</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => runAnalysis(meal)}
                    disabled={analyzing === meal.id}
                    className="mt-3 flex-row items-center self-start rounded-full border border-brand/40 px-3 py-1.5"
                  >
                    <Sparkles size={14} color={colors.brand} />
                    <Text className="ml-1.5 text-xs font-semibold text-brand">
                      {analyzing === meal.id ? 'Analyse…' : 'Analyser avec l’IA'}
                    </Text>
                  </Pressable>
                )}
              </Card>
            );
          })
      )}
    </Screen>
  );
}
