import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormInput } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useProjects, useUpsert, useUserId } from '@/hooks/useData';
import type { Project } from '@/types/models';
import { formatDay } from '@/utils/date';
import { uid } from '@/utils/id';

interface ProjectForm {
  name: string;
  emoji: string;
  goal: string;
  deadline: string;
}

export default function ProjectsScreen() {
  const userId = useUserId();
  const projects = useProjects(userId);
  const upsert = useUpsert<Project>('projects');
  const [creating, setCreating] = useState(false);
  const { control, handleSubmit, reset } = useForm<ProjectForm>({
    defaultValues: { name: '', emoji: '🎯', goal: '', deadline: '' },
  });

  const create = handleSubmit(async (v) => {
    await upsert.mutateAsync({
      id: uid(), userId, createdAt: Date.now(), shared: true,
      name: v.name, emoji: v.emoji || '🎯', goal: v.goal,
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(v.deadline) ? v.deadline : undefined,
      tasks: [],
    });
    reset();
    setCreating(false);
  });

  return (
    <Screen refreshing={projects.isRefetching} onRefresh={() => projects.refetch()}>
      <View className="mt-2 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="flex-row items-center py-2 pr-4">
          <ChevronLeft size={22} color={colors.ink} />
          <Text className="text-2xl font-bold text-ink">Projets</Text>
        </Pressable>
        <Pressable onPress={() => setCreating((c) => !c)} className="h-11 w-11 items-center justify-center rounded-full bg-brand">
          {creating ? <X size={22} color={colors.bg} /> : <Plus size={22} color={colors.bg} />}
        </Pressable>
      </View>

      {creating ? (
        <Card className="mt-4">
          <FormInput control={control} name="name" label="Nom du projet" placeholder="Marathon 2026" rules={{ required: 'Nom requis' }} />
          <FormInput control={control} name="goal" label="Objectif" placeholder="Finir en moins de 4h" />
          <View className="flex-row gap-3">
            <View className="flex-1"><FormInput control={control} name="emoji" label="Emoji" placeholder="🏃" /></View>
            <View className="flex-1"><FormInput control={control} name="deadline" label="Deadline (AAAA-MM-JJ)" placeholder="2026-10-01" /></View>
          </View>
          <Button title="Créer le projet" onPress={create} />
        </Card>
      ) : null}

      {(projects.data ?? []).length === 0 && !creating ? (
        <EmptyState emoji="📋" title="Aucun projet" subtitle="Crée un projet avec objectifs, kanban et checklist." />
      ) : (
        (projects.data ?? []).map((p) => {
          const done = p.tasks.filter((t) => t.status === 'done').length;
          const progress = p.tasks.length ? done / p.tasks.length : 0;
          return (
            <Card key={p.id} className="mt-3" onPress={() => router.push({ pathname: '/projects/[id]', params: { id: p.id } })}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-ink">{p.emoji} {p.name}</Text>
                {p.deadline ? <Text className="text-xs capitalize text-warn">⏳ {formatDay(p.deadline)}</Text> : null}
              </View>
              {p.goal ? <Text className="mt-1 text-sm text-mute">{p.goal}</Text> : null}
              <View className="mt-3 flex-row items-center gap-3">
                <View className="flex-1">
                  <ProgressBar value={progress} height={6} />
                </View>
                <Text className="text-xs font-semibold text-mute">{done}/{p.tasks.length} tâches</Text>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
