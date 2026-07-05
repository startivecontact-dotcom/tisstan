import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, Play, Plus, Trash2, Trophy, X } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { BarChart } from '@/components/charts/BarChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormInput } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors } from '@/constants/theme';
import { useRemove, useUpsert, useUserId, useWorkouts } from '@/hooks/useData';
import type { PersonalRecord, Workout } from '@/types/models';
import { dayjs, formatDay, lastNDays, todayISO } from '@/utils/date';
import { uid } from '@/utils/id';

interface TemplateForm {
  name: string;
  exercises: string;
}

/** Records personnels : meilleure charge par exercice sur les séances complétées. */
function computeRecords(sessions: Workout[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const s of sessions) {
    if (!s.completed || !s.date) continue;
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.done || set.weightKg <= 0) continue;
        const cur = best.get(ex.name);
        if (!cur || set.weightKg > cur.weightKg) {
          best.set(ex.name, { exercise: ex.name, weightKg: set.weightKg, reps: set.reps, date: s.date });
        }
      }
    }
  }
  return [...best.values()].sort((a, b) => b.weightKg - a.weightKg);
}

export default function SportScreen() {
  const userId = useUserId();
  const workouts = useWorkouts(userId);
  const upsert = useUpsert<Workout>('workouts');
  const remove = useRemove('workouts');
  const [creating, setCreating] = useState(false);
  const { control, handleSubmit, reset } = useForm<TemplateForm>({ defaultValues: { name: '', exercises: '' } });

  const templates = (workouts.data ?? []).filter((w) => w.isTemplate);
  const sessions = (workouts.data ?? [])
    .filter((w) => !w.isTemplate && w.date)
    .sort((a, b) => b.date!.localeCompare(a.date!));
  const records = useMemo(() => computeRecords(sessions), [sessions]);

  const week = lastNDays(28);
  const weeklyCounts = [0, 1, 2, 3].map((w) =>
    sessions.filter((s) => {
      const idx = week.indexOf(s.date!);
      return idx >= 0 && Math.floor(idx / 7) === w && s.completed;
    }).length,
  );

  const startSession = async (template: Workout) => {
    const session: Workout = {
      ...template,
      id: uid(),
      isTemplate: false,
      date: todayISO(),
      createdAt: Date.now(),
      completed: false,
      exercises: template.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) })),
    };
    await upsert.mutateAsync(session);
    router.push({ pathname: '/workout/[id]', params: { id: session.id } });
  };

  const createTemplate = handleSubmit(async (v) => {
    // Format d'une ligne : "Développé couché 3x8 @60"
    const exercises = v.exercises
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(.+?)\s+(\d+)\s*[x×]\s*(\d+)(?:\s*@\s*([\d.,]+))?$/i);
        const name = m ? m[1].trim() : line;
        const setsCount = m ? Number(m[2]) : 3;
        const reps = m ? Number(m[3]) : 10;
        const weight = m?.[4] ? Number(m[4].replace(',', '.')) : 0;
        return {
          name,
          restSec: 90,
          sets: Array.from({ length: setsCount }, () => ({ reps, weightKg: weight })),
        };
      });
    await upsert.mutateAsync({
      id: uid(), userId, createdAt: Date.now(), isTemplate: true, name: v.name, exercises,
    });
    reset();
    setCreating(false);
  });

  return (
    <Screen refreshing={workouts.isRefetching} onRefresh={() => workouts.refetch()}>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-3xl font-bold tracking-tight text-ink">Sport</Text>
        <Pressable onPress={() => setCreating((c) => !c)} className="h-11 w-11 items-center justify-center rounded-full bg-brand">
          {creating ? <X size={22} color={colors.bg} /> : <Plus size={22} color={colors.bg} />}
        </Pressable>
      </View>

      {creating ? (
        <Card className="mt-4">
          <Text className="mb-3 text-base font-bold text-ink">Nouveau programme</Text>
          <FormInput control={control} name="name" label="Nom" placeholder="Full body" rules={{ required: 'Nom requis' }} />
          <FormInput
            control={control}
            name="exercises"
            label="Exercices (1 par ligne : nom séries×reps @charge)"
            placeholder={'Squat 4x8 @80\nDéveloppé couché 3x10 @60\nTractions 3x8'}
            multiline
            numberOfLines={5}
            style={{ minHeight: 110, textAlignVertical: 'top' }}
            rules={{ required: 'Au moins un exercice' }}
          />
          <Button title="Créer le programme" onPress={createTemplate} />
        </Card>
      ) : null}

      {/* Volume hebdo */}
      <Card className="mt-4">
        <Text className="mb-2 text-sm font-semibold text-ink">Séances par semaine (4 dernières)</Text>
        <BarChart data={weeklyCounts} labels={['S-3', 'S-2', 'S-1', 'Cette sem.']} color={colors.brand} height={90} />
      </Card>

      <SectionTitle title="Mes programmes" />
      {templates.length === 0 ? (
        <EmptyState emoji="🏋️" title="Aucun programme" subtitle="Crée ton premier programme avec le bouton +" />
      ) : (
        templates.map((t) => (
          <Card key={t.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-ink">{t.name}</Text>
                <Text className="mt-0.5 text-xs text-mute">
                  {t.exercises.length} exercices · {t.exercises.reduce((a, e) => a + e.sets.length, 0)} séries
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable onPress={() => remove.mutate(t.id)} className="p-2">
                  <Trash2 size={16} color={colors.mute} />
                </Pressable>
                <Pressable onPress={() => startSession(t)} className="flex-row items-center rounded-full bg-brand px-4 py-2">
                  <Play size={14} color={colors.bg} />
                  <Text className="ml-1.5 text-sm font-bold text-bg">Démarrer</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        ))
      )}

      <SectionTitle title="Records personnels" />
      {records.length === 0 ? (
        <EmptyState emoji="🏆" title="Pas encore de record" subtitle="Termine une séance pour débloquer tes PR." />
      ) : (
        <Card>
          {records.slice(0, 6).map((r) => (
            <View key={r.exercise} className="flex-row items-center justify-between border-b border-line py-2.5 last:border-b-0">
              <View className="flex-row items-center">
                <Trophy size={16} color={colors.warn} />
                <Text className="ml-2 font-semibold text-ink">{r.exercise}</Text>
              </View>
              <Text className="text-sm text-mute">
                <Text className="font-bold text-brand">{r.weightKg} kg</Text> × {r.reps} · {formatDay(r.date)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <SectionTitle title="Historique" />
      {sessions.slice(0, 10).map((s) => (
        <Card key={s.id} className="mb-3" onPress={() => router.push({ pathname: '/workout/[id]', params: { id: s.id } })}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Dumbbell size={18} color={s.completed ? colors.brand : colors.mute} />
              <View className="ml-3">
                <Text className="font-semibold text-ink">{s.name}</Text>
                <Text className="text-xs capitalize text-mute">
                  {formatDay(s.date!)}{s.durationMin ? ` · ${s.durationMin} min` : ''}
                </Text>
              </View>
            </View>
            <Text className={`text-xs font-bold ${s.completed ? 'text-brand' : 'text-warn'}`}>
              {s.completed ? 'Terminée ✓' : 'En cours'}
            </Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
