import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: Props) {
  return (
    <View className="items-center justify-center py-12">
      <Text className="text-5xl">{emoji}</Text>
      <Text className="mt-3 text-base font-semibold text-ink">{title}</Text>
      {subtitle ? <Text className="mt-1 px-8 text-center text-sm text-mute">{subtitle}</Text> : null}
    </View>
  );
}
