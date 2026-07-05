import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useList, useRemove, useUpsert, useUserId } from '@/hooks/useData';
import { pickImage, uploadPhoto } from '@/services/photos';
import type { PhotoDoc, PhotoKind } from '@/types/models';
import { formatDay, todayISO } from '@/utils/date';
import { uid } from '@/utils/id';

const KINDS: { key: PhotoKind; label: string; emoji: string }[] = [
  { key: 'before-after', label: 'Avant / Après', emoji: '📈' },
  { key: 'meal', label: 'Repas', emoji: '🍽️' },
  { key: 'motivation', label: 'Motivation', emoji: '🔥' },
  { key: 'workout', label: 'Entraînement', emoji: '🏋️' },
];

export default function PhotosScreen() {
  const userId = useUserId();
  const photos = useList<PhotoDoc>('photos', { userId });
  const upsert = useUpsert<PhotoDoc>('photos');
  const remove = useRemove('photos');
  const [kind, setKind] = useState<PhotoKind>('before-after');
  const [uploading, setUploading] = useState(false);

  const filtered = (photos.data ?? []).filter((p) => p.kind === kind);

  const add = async () => {
    const img = await pickImage(false);
    if (!img) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(userId, img.uri, `photos/${kind}`);
      await upsert.mutateAsync({
        id: uid(), userId, createdAt: Date.now(), kind, url, date: todayISO(),
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen refreshing={photos.isRefetching} onRefresh={() => photos.refetch()}>
      <View className="mt-2 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="flex-row items-center py-2 pr-4">
          <ChevronLeft size={22} color={colors.ink} />
          <Text className="text-2xl font-bold text-ink">Photos</Text>
        </Pressable>
        <Pressable onPress={add} disabled={uploading} className="h-11 w-11 items-center justify-center rounded-full bg-brand">
          <Plus size={22} color={colors.bg} />
        </Pressable>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {KINDS.map((k) => (
          <Pressable
            key={k.key}
            onPress={() => setKind(k.key)}
            className={`rounded-full border px-4 py-2 ${kind === k.key ? 'border-brand bg-brand/15' : 'border-line bg-surface'}`}
          >
            <Text className={`text-sm font-semibold ${kind === k.key ? 'text-brand' : 'text-mute'}`}>
              {k.emoji} {k.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {uploading ? <Text className="mt-3 text-sm text-brand">Envoi de la photo…</Text> : null}

      {filtered.length === 0 ? (
        <EmptyState emoji="📷" title="Aucune photo dans cette catégorie" subtitle="Les photos avant/après sont le meilleur miroir de tes progrès." />
      ) : (
        <View className="mt-4 flex-row flex-wrap justify-between">
          {filtered.map((p) => (
            <Card key={p.id} className="mb-3 w-[48.5%] overflow-hidden p-0">
              <Pressable onLongPress={() => remove.mutate(p.id)}>
                <Image source={{ uri: p.url }} className="h-44 w-full" resizeMode="cover" />
                <View className="p-2.5">
                  <Text className="text-xs capitalize text-mute">{formatDay(p.date)}</Text>
                </View>
              </Pressable>
            </Card>
          ))}
        </View>
      )}
      {filtered.length > 0 ? (
        <Text className="mt-1 text-center text-xs text-mute">Appui long sur une photo pour la supprimer</Text>
      ) : null}
    </Screen>
  );
}
