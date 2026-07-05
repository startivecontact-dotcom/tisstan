import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendHorizonal, Sparkles } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useList, useUpsert, useUserId } from '@/hooks/useData';
import { useDaySummary } from '@/hooks/useDashboard';
import { coachChat, isAiEnabled } from '@/services/ai';
import type { AiMessage } from '@/types/models';
import { uid } from '@/utils/id';

const SUGGESTIONS = [
  'Fais-moi un programme sport',
  'Analyse ma progression',
  'Plan nutrition pour demain',
  'Comment mieux dormir ?',
  'Motive-moi 🔥',
];

export default function CoachScreen() {
  const userId = useUserId();
  const insets = useSafeAreaInsets();
  const summary = useDaySummary(userId);
  const history = useList<AiMessage>('aiHistory', { userId, limit: 50 });
  const upsert = useUpsert<AiMessage>('aiHistory');
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList<AiMessage>>(null);

  const messages = [...(history.data ?? [])].sort((a, b) => a.createdAt - b.createdAt);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput('');
    setThinking(true);
    try {
      await upsert.mutateAsync({ id: uid(), userId, createdAt: Date.now(), role: 'user', text: trimmed });
      const reply = await coachChat(trimmed, summary.coachContext);
      await upsert.mutateAsync({ id: uid(), userId, createdAt: Date.now() + 1, role: 'assistant', text: reply });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setThinking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <View>
          <Text className="text-3xl font-bold tracking-tight text-ink">Coach IA</Text>
          <Text className="text-xs text-mute">
            {isAiEnabled ? 'Gemini connecté · disponible 24h/24' : 'Mode démo · réponses hors-ligne'}
          </Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-brand/15">
          <Sparkles size={22} color={colors.brand} />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-5xl">🤖</Text>
            <Text className="mt-3 text-center text-base font-semibold text-ink">
              Ton coach connaît ton poids, tes repas,{'\n'}ton sommeil et tes séances.
            </Text>
            <Text className="mt-1 text-sm text-mute">Pose-lui n’importe quelle question.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            className={`mb-3 max-w-[85%] rounded-3xl px-4 py-3 ${
              item.role === 'user' ? 'self-end rounded-br-md bg-brand' : 'self-start rounded-bl-md border border-line bg-card'
            }`}
          >
            <Text className={`text-base leading-6 ${item.role === 'user' ? 'font-medium text-bg' : 'text-ink'}`}>
              {item.text}
            </Text>
          </View>
        )}
        ListFooterComponent={
          thinking ? (
            <View className="mb-3 self-start rounded-3xl rounded-bl-md border border-line bg-card px-4 py-3">
              <Text className="text-base text-mute">Le coach réfléchit…</Text>
            </View>
          ) : null
        }
      />

      {/* Suggestions */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={SUGGESTIONS}
        keyExtractor={(sug) => sug}
        className="max-h-12 px-5"
        renderItem={({ item }) => (
          <Pressable onPress={() => send(item)} className="mr-2 justify-center rounded-full border border-line bg-surface px-4">
            <Text className="text-sm text-ink">{item}</Text>
          </Pressable>
        )}
      />

      <View className="flex-row items-center gap-3 px-5 pt-3" style={{ paddingBottom: insets.bottom + 92 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Écris à ton coach…"
          placeholderTextColor={colors.mute}
          className="flex-1 rounded-full border border-line bg-surface px-5 py-3.5 text-base text-ink"
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <Pressable
          onPress={() => send(input)}
          disabled={thinking || !input.trim()}
          className={`h-12 w-12 items-center justify-center rounded-full ${input.trim() && !thinking ? 'bg-brand' : 'bg-line'}`}
        >
          <SendHorizonal size={20} color={input.trim() && !thinking ? colors.bg : colors.mute} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
