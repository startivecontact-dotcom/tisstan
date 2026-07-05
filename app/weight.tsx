import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { LineChart } from '@/components/charts/LineChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors } from '@/constants/theme';
import { useRemove, useUpsert, useUserId, useWeights } from '@/hooks/useData';
import { useAuth } from '@/stores/auth';
import { weightComment } from '@/services/ai';
import type { WeightEntry } from '@/types/models';
import { dayjs, formatDay, todayISO } from '@/utils/date';
import { uid } from '@/utils/id';
import { bmi, bmiLabel, estimatedBodyFat, idealWeight } from '@/utils/nutrition';

interface WeightForm {
  weightKg: string;
}

export default function WeightScreen() {
  const userId = useUserId();
  const profile = useAuth((s) => s.profile);
  const weights = useWeights(userId);
  const upsert = useUpsert<WeightEntry>('weight');
  const remove = useRemove('weight');
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit, reset } = useForm<WeightForm>({ defaultValues: { weightKg: '' } });

  const entries = [...(weights.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const latest = entries[0];
  const goals = profile?.goals;

  const heightCm = profile?.heightCm ?? 178;
  const sex = profile?.sex ?? 'male';
  const age = profile?.birthYear ? dayjs().year() - profile.birthYear : 27;

  const chartData = [...entries].reverse().slice(-30);

  const save = handleSubmit(async (v) => {
    const weightKg = Number(v.weightKg.replace(',', '.'));
    if (!weightKg || weightKg < 30 || weightKg > 250) return;
    setSaving(true);
    try {
      const entry: WeightEntry = { id: uid(), userId, createdAt: Date.now(), date: todayISO(), weightKg };
      await upsert.mutateAsync(entry);
      reset();
      if (goals) setAiComment(await weightComment([entry, ...entries], goals));
    } finally {
      setSaving(false);
    }
  });

  return (
    <Screen refreshing={weights.isRefetching} onRefresh={() => weights.refetch()}>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Poids</Text>
      </Pressable>

      {/* Chiffres clés */}
      <View className="mt-3 flex-row gap-3">
        <Card className="flex-1 items-center">
          <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Actuel</Text>
          <Text className="mt-1 text-2xl font-bold text-ink">{latest ? `${latest.weightKg}` : '—'} kg</Text>
        </Card>
        <Card className="flex-1 items-center">
          <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Objectif</Text>
          <Text className="mt-1 text-2xl font-bold text-brand">{goals?.weightKg ?? '—'} kg</Text>
        </Card>
        <Card className="flex-1 items-center">
          <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Restant</Text>
          <Text className="mt-1 text-2xl font-bold text-sky">
            {latest && goals ? `${Math.abs(latest.weightKg - goals.weightKg).toFixed(1)}` : '—'} kg
          </Text>
        </Card>
      </View>

      {/* Graphique */}
      <Card className="mt-3">
        <Text className="mb-2 text-sm font-semibold text-ink">Évolution (30 dernières pesées)</Text>
        <LineChart
          data={chartData.map((e) => e.weightKg)}
          goal={goals?.weightKg}
          formatValue={(v) => `${v} kg`}
        />
      </Card>

      {/* IMC / masse grasse / poids idéal */}
      {latest ? (
        <View className="mt-3 flex-row gap-3">
          <Card className="flex-1 items-center">
            <Text className="text-xs font-semibold uppercase tracking-widest text-mute">IMC</Text>
            <Text className="mt-1 text-xl font-bold text-ink">{bmi(latest.weightKg, heightCm)}</Text>
            <Text className="text-xs text-mute">{bmiLabel(bmi(latest.weightKg, heightCm))}</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Masse grasse</Text>
            <Text className="mt-1 text-xl font-bold text-ink">~{estimatedBodyFat(latest.weightKg, heightCm, age, sex)}%</Text>
            <Text className="text-xs text-mute">estimée</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-xs font-semibold uppercase tracking-widest text-mute">Poids idéal</Text>
            <Text className="mt-1 text-xl font-bold text-ink">{idealWeight(heightCm, sex)} kg</Text>
            <Text className="text-xs text-mute">Lorentz</Text>
          </Card>
        </View>
      ) : null}

      {/* Ajout */}
      <Card className="mt-3">
        <Text className="mb-3 text-base font-bold text-ink">Pesée du jour</Text>
        <FormInput
          control={control}
          name="weightKg"
          label="Poids (kg)"
          placeholder="78.4"
          keyboardType="decimal-pad"
          rules={{ required: 'Poids requis' }}
        />
        <Button title="Enregistrer" onPress={save} loading={saving} />
        {aiComment ? (
          <View className="mt-3 rounded-2xl border border-brand/25 bg-brand/5 p-3">
            <Text className="text-sm leading-5 text-ink">✨ {aiComment}</Text>
          </View>
        ) : null}
      </Card>

      <SectionTitle title="Historique" />
      <Card>
        {entries.slice(0, 15).map((e, i) => {
          const prev = entries[i + 1];
          const delta = prev ? e.weightKg - prev.weightKg : 0;
          return (
            <View key={e.id} className="flex-row items-center justify-between border-b border-line py-2.5">
              <Text className="capitalize text-ink">{formatDay(e.date)}</Text>
              <View className="flex-row items-center gap-3">
                <Text className={`text-xs font-semibold ${delta < 0 ? 'text-brand' : delta > 0 ? 'text-danger' : 'text-mute'}`}>
                  {prev ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : ''}
                </Text>
                <Text className="font-bold text-ink">{e.weightKg} kg</Text>
                <Pressable onPress={() => remove.mutate(e.id)}>
                  <Trash2 size={14} color={colors.mute} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
