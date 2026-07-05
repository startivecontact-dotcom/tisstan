import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MessageSquare, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useProjects, useUpsert, useUserId } from '@/hooks/useData';
import type { Project, ProjectTask, TaskStatus } from '@/types/models';
import { uid } from '@/utils/id';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'À faire', color: colors.mute },
  { status: 'doing', label: 'En cours', color: colors.sky },
  { status: 'done', label: 'Terminé', color: colors.brand },
];

/** Détail d'un projet : kanban horizontal, sous-tâches et commentaires. */
export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const projects = useProjects(userId);
  const upsert = useUpsert<Project>('projects');
  const [newTask, setNewTask] = useState('');
  const [comment, setComment] = useState<Record<string, string>>({});

  const project = (projects.data ?? []).find((p) => p.id === id);
  if (!project) {
    return (
      <Screen scroll={false}>
        <Text className="mt-20 text-center text-mute">Projet introuvable</Text>
      </Screen>
    );
  }

  const patchTask = (taskId: string, patch: Partial<ProjectTask>) => {
    upsert.mutate({
      ...project,
      tasks: project.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    upsert.mutate({
      ...project,
      tasks: [...project.tasks, { id: uid(), title: newTask.trim(), status: 'todo', subtasks: [], comments: [] }],
    });
    setNewTask('');
  };

  const moveTask = (task: ProjectTask) => {
    const order: TaskStatus[] = ['todo', 'doing', 'done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    patchTask(task.id, { status: next });
  };

  const addComment = (task: ProjectTask) => {
    const text = (comment[task.id] ?? '').trim();
    if (!text) return;
    patchTask(task.id, { comments: [...task.comments, { id: uid(), userId, text, at: Date.now() }] });
    setComment((c) => ({ ...c, [task.id]: '' }));
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">{project.emoji} {project.name}</Text>
      </Pressable>
      {project.goal ? <Text className="mt-1 text-sm text-mute">🎯 {project.goal}</Text> : null}

      {/* Ajout de tâche */}
      <View className="mt-4 flex-row items-center gap-3">
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Nouvelle tâche…"
          placeholderTextColor={colors.mute}
          className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink"
          onSubmitEditing={addTask}
        />
        <Pressable onPress={addTask} className="h-11 w-11 items-center justify-center rounded-full bg-brand">
          <Plus size={20} color={colors.bg} />
        </Pressable>
      </View>

      {/* Kanban */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-5 px-5">
        {COLUMNS.map((col) => {
          const tasks = project.tasks.filter((t) => t.status === col.status);
          return (
            <View key={col.status} className="mr-3 w-72">
              <View className="mb-2 flex-row items-center">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <Text className="ml-2 text-sm font-bold text-ink">{col.label}</Text>
                <Text className="ml-2 text-xs text-mute">{tasks.length}</Text>
              </View>
              {tasks.map((task) => (
                <Card key={task.id} className="mb-3">
                  <Pressable onPress={() => moveTask(task)}>
                    <Text className="font-semibold text-ink">{task.title}</Text>
                    <Text className="mt-0.5 text-[10px] text-mute">Appuyer pour déplacer →</Text>
                  </Pressable>

                  {/* Sous-tâches */}
                  {task.subtasks.map((st) => (
                    <Pressable
                      key={st.id}
                      className="mt-2 flex-row items-center"
                      onPress={() =>
                        patchTask(task.id, {
                          subtasks: task.subtasks.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)),
                        })
                      }
                    >
                      <Text className="text-sm">{st.done ? '☑️' : '⬜'}</Text>
                      <Text className={`ml-2 text-sm ${st.done ? 'text-mute line-through' : 'text-ink'}`}>{st.title}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    className="mt-2"
                    onPress={() =>
                      patchTask(task.id, {
                        subtasks: [...task.subtasks, { id: uid(), title: `Étape ${task.subtasks.length + 1}`, done: false }],
                      })
                    }
                  >
                    <Text className="text-xs font-semibold text-brand">+ Sous-tâche</Text>
                  </Pressable>

                  {/* Commentaires */}
                  {task.comments.map((c) => (
                    <View key={c.id} className="mt-2 rounded-xl bg-surface p-2">
                      <Text className="text-xs text-ink">
                        <Text className="font-bold capitalize">{c.userId}</Text> · {c.text}
                      </Text>
                    </View>
                  ))}
                  <View className="mt-2 flex-row items-center gap-2">
                    <TextInput
                      value={comment[task.id] ?? ''}
                      onChangeText={(t) => setComment((c) => ({ ...c, [task.id]: t }))}
                      placeholder="Commenter…"
                      placeholderTextColor={colors.mute}
                      className="flex-1 rounded-xl bg-surface px-3 py-2 text-xs text-ink"
                      onSubmitEditing={() => addComment(task)}
                    />
                    <Pressable onPress={() => addComment(task)}>
                      <MessageSquare size={16} color={colors.brand} />
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
