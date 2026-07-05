import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, ChevronLeft, TimerReset } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useUpsert, useUserId, useWorkouts } from '@/hooks/useData';
import type { Workout } from '@/types/models';

function fmtClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Écran de séance en cours : chrono global, timer de repos, validation des séries. */
export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const workouts = useWorkouts(userId);
  const upsert = useUpsert<Workout>('workouts');

  const workout = (workouts.data ?? []).find((w) => w.id === id);

  // Chronomètre global de la séance.
  const [elapsed, setElapsed] = useState(0);
  // Timer de repos (compte à rebours).
  const [rest, setRest] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setRest(null);
      return;
    }
    restRef.current = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000) as unknown as ReturnType<typeof setInterval>;
    return () => { if (restRef.current) clearTimeout(restRef.current); };
  }, [rest]);

  if (!workout) {
    return (
      <Screen scroll={false}>
        <Text className="mt-20 text-center text-mute">Séance introuvable</Text>
      </Screen>
    );
  }

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = workout.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);

  const toggleSet = async (exIdx: number, setIdx: number) => {
    const next: Workout = {
      ...workout,
      exercises: workout.exercises.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: e.sets.map((s, j) => (j !== setIdx ? s : { ...s, done: !s.done })) },
      ),
    };
    await upsert.mutateAsync(next);
    const nowDone = !workout.exercises[exIdx].sets[setIdx].done;
    if (nowDone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setRest(workout.exercises[exIdx].restSec);
    }
  };

  const finish = async () => {
    await upsert.mutateAsync({ ...workout, completed: true, durationMin: Math.max(1, Math.round(elapsed / 60)) });
    router.back();
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="flex-row items-center py-2 pr-3">
          <ChevronLeft size={22} color={colors.ink} />
          <Text className="text-lg font-bold text-ink">{workout.name}</Text>
        </Pressable>
        <Text className="font-mono text-lg font-bold text-brand">{fmtClock(elapsed)}</Text>
      </View>

      <Card className="mt-3">
        <View className="flex-row justify-between">
          <Text className="text-sm font-semibold text-ink">Progression</Text>
          <Text className="text-sm text-mute">{doneSets} / {totalSets} séries</Text>
        </View>
        <View className="mt-2">
          <ProgressBar value={totalSets ? doneSets / totalSets : 0} />
        </View>
      </Card>

      {/* Timer de repos */}
      {rest !== null ? (
        <Card className="mt-3 items-center border-sky/40 bg-sky/10">
          <Text className="text-xs font-semibold uppercase tracking-widest text-sky">Repos</Text>
          <Text className="font-mono text-4xl font-bold text-ink">{fmtClock(rest)}</Text>
          <Pressable onPress={() => setRest(null)} className="mt-2 flex-row items-center">
            <TimerReset size={14} color={colors.mute} />
            <Text className="ml-1 text-xs text-mute">Passer</Text>
          </Pressable>
        </Card>
      ) : null}

      {workout.exercises.map((ex, exIdx) => (
        <Card key={exIdx} className="mt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-ink">{ex.name}</Text>
            <Text className="text-xs text-mute">repos {ex.restSec}s</Text>
          </View>
          {ex.sets.map((set, setIdx) => (
            <Pressable
              key={setIdx}
              onPress={() => toggleSet(exIdx, setIdx)}
              className={`mt-2 flex-row items-center justify-between rounded-2xl border p-3 ${set.done ? 'border-brand/50 bg-brand/10' : 'border-line bg-surface'}`}
            >
              <Text className={`font-semibold ${set.done ? 'text-brand' : 'text-ink'}`}>Série {setIdx + 1}</Text>
              <View className="flex-row items-center gap-4">
                <Text className="text-sm text-mute">
                  {set.reps} reps{set.weightKg > 0 ? ` · ${set.weightKg} kg` : ''}
                </Text>
                <View className={`h-6 w-6 items-center justify-center rounded-full ${set.done ? 'bg-brand' : 'bg-line'}`}>
                  {set.done ? <Check size={14} color={colors.bg} /> : null}
                </View>
              </View>
            </Pressable>
          ))}
        </Card>
      ))}

      <View className="mt-6">
        <Button
          title={workout.completed ? 'Séance terminée ✓' : 'Terminer la séance'}
          onPress={finish}
          disabled={workout.completed}
        />
      </View>
    </Screen>
  );
}
