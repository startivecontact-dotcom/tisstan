import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, action, onAction }: Props) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between">
      <Text className="text-lg font-bold text-ink">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} className="flex-row items-center">
          <Text className="text-sm font-semibold text-brand">{action}</Text>
          <ChevronRight size={16} color={colors.brand} />
        </Pressable>
      ) : null}
    </View>
  );
}
