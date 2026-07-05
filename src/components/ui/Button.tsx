import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-brand',
  secondary: 'bg-card border border-line',
  ghost: 'bg-transparent',
  danger: 'bg-danger/15 border border-danger/40',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-bg font-bold',
  secondary: 'text-ink font-semibold',
  ghost: 'text-brand font-semibold',
  danger: 'text-danger font-semibold',
};

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  className?: string;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, small, className = '' }: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-2xl ${small ? 'px-4 py-2' : 'px-5 py-4'} ${CONTAINER[variant]} ${disabled ? 'opacity-40' : ''} ${className}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : disabled ? 0.4 : 1 })}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.brand} />
      ) : (
        <Text className={`${LABEL[variant]} ${small ? 'text-sm' : 'text-base'}`}>{title}</Text>
      )}
    </Pressable>
  );
}
