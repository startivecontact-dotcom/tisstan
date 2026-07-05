import React from 'react';
import { Pressable, View, type ViewProps } from 'react-native';
import { shadow } from '@/constants/theme';

interface Props extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

/** Carte "glass" : surface sombre, bord subtil, coins très arrondis. */
export function Card({ children, onPress, className = '', style, ...rest }: Props) {
  const base = `rounded-3xl bg-card border border-line p-4 ${className}`;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={base}
        style={({ pressed }) => [shadow.card, { opacity: pressed ? 0.85 : 1 }, style as object]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View className={base} style={[shadow.card, style]} {...rest}>
      {children}
    </View>
  );
}
