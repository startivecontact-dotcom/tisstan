import React, { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ImageIcon, SendHorizonal } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { USERS } from '@/constants/config';
import { colors } from '@/constants/theme';
import { usePosts, useUpsert, useUserId } from '@/hooks/useData';
import { pickImage, uploadPhoto } from '@/services/photos';
import type { Post, Reaction } from '@/types/models';
import { dayjs } from '@/utils/date';
import { uid } from '@/utils/id';

const REACTIONS: Reaction[] = ['❤️', '🔥', '💪'];

/** Mur privé partagé entre Stanne et Tissam. */
export default function MotivationScreen() {
  const userId = useUserId();
  const posts = usePosts(userId);
  const upsert = useUpsert<Post>('posts');
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState(false);

  const publish = async () => {
    if (!text.trim() && !photo) return;
    setPosting(true);
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadPhoto(userId, photo, 'motivation');
      await upsert.mutateAsync({
        id: uid(), userId, createdAt: Date.now(), shared: true,
        text: text.trim(), photoUrl, reactions: {}, comments: [],
      });
      setText('');
      setPhoto(null);
    } finally {
      setPosting(false);
    }
  };

  const react = (post: Post, r: Reaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const current = post.reactions[r] ?? [];
    const next = current.includes(userId) ? current.filter((u) => u !== userId) : [...current, userId];
    upsert.mutate({ ...post, reactions: { ...post.reactions, [r]: next } });
  };

  const addComment = (post: Post) => {
    const t = (comment[post.id] ?? '').trim();
    if (!t) return;
    upsert.mutate({ ...post, comments: [...post.comments, { id: uid(), userId, text: t, at: Date.now() }] });
    setComment((c) => ({ ...c, [post.id]: '' }));
  };

  return (
    <Screen refreshing={posts.isRefetching} onRefresh={() => posts.refetch()}>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Mur de motivation</Text>
      </Pressable>
      <Text className="mt-1 text-sm text-mute">Privé — visible uniquement par Stanne & Tissam 🔒</Text>

      {/* Composer */}
      <Card className="mt-4">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Un message, une citation, une victoire…"
          placeholderTextColor={colors.mute}
          multiline
          className="min-h-[60px] text-base text-ink"
          style={{ textAlignVertical: 'top' }}
        />
        {photo ? <Image source={{ uri: photo }} className="mt-2 h-44 w-full rounded-2xl" resizeMode="cover" /> : null}
        <View className="mt-3 flex-row items-center justify-between">
          <Pressable
            onPress={async () => {
              const img = await pickImage(false);
              if (img) setPhoto(img.uri);
            }}
            className="flex-row items-center rounded-full border border-line px-4 py-2"
          >
            <ImageIcon size={16} color={colors.sky} />
            <Text className="ml-2 text-sm font-semibold text-ink">Photo</Text>
          </Pressable>
          <Pressable
            onPress={publish}
            disabled={posting || (!text.trim() && !photo)}
            className={`flex-row items-center rounded-full px-5 py-2.5 ${text.trim() || photo ? 'bg-brand' : 'bg-line'}`}
          >
            <SendHorizonal size={16} color={text.trim() || photo ? colors.bg : colors.mute} />
            <Text className={`ml-2 font-bold ${text.trim() || photo ? 'text-bg' : 'text-mute'}`}>
              {posting ? '…' : 'Publier'}
            </Text>
          </Pressable>
        </View>
      </Card>

      {/* Fil */}
      {(posts.data ?? []).length === 0 ? (
        <EmptyState emoji="💬" title="Le mur est vide" subtitle="Publie le premier message de motivation !" />
      ) : (
        (posts.data ?? []).map((post) => {
          const author = USERS[post.userId];
          return (
            <Card key={post.id} className="mt-3">
              <View className="flex-row items-center">
                <Avatar profile={author} size={38} />
                <View className="ml-3">
                  <Text className="font-bold text-ink">{author.name}</Text>
                  <Text className="text-xs text-mute">{dayjs(post.createdAt).fromNow()}</Text>
                </View>
              </View>
              {post.text ? <Text className="mt-3 text-base leading-6 text-ink">{post.text}</Text> : null}
              {post.photoUrl ? <Image source={{ uri: post.photoUrl }} className="mt-3 h-52 w-full rounded-2xl" resizeMode="cover" /> : null}

              <View className="mt-3 flex-row gap-2">
                {REACTIONS.map((r) => {
                  const users = post.reactions[r] ?? [];
                  const mine = users.includes(userId);
                  return (
                    <Pressable
                      key={r}
                      onPress={() => react(post, r)}
                      className={`flex-row items-center rounded-full border px-3 py-1.5 ${mine ? 'border-brand bg-brand/15' : 'border-line bg-surface'}`}
                    >
                      <Text className="text-sm">{r}</Text>
                      {users.length > 0 ? <Text className={`ml-1.5 text-xs font-bold ${mine ? 'text-brand' : 'text-mute'}`}>{users.length}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>

              {post.comments.map((c) => (
                <View key={c.id} className="mt-2 rounded-xl bg-surface p-2.5">
                  <Text className="text-sm text-ink">
                    <Text className="font-bold">{USERS[c.userId].name}</Text>  {c.text}
                  </Text>
                </View>
              ))}
              <View className="mt-2 flex-row items-center gap-2">
                <TextInput
                  value={comment[post.id] ?? ''}
                  onChangeText={(t) => setComment((c) => ({ ...c, [post.id]: t }))}
                  placeholder="Répondre…"
                  placeholderTextColor={colors.mute}
                  className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm text-ink"
                  onSubmitEditing={() => addComment(post)}
                />
                <Pressable onPress={() => addComment(post)}>
                  <SendHorizonal size={18} color={colors.brand} />
                </Pressable>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
