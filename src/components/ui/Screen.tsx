import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  /** Contenu scrollable (par défaut) ou fixe. */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
}

/** Conteneur de base de tous les écrans : fond sombre + safe area + scroll. */
export function Screen({ children, scroll = true, refreshing = false, onRefresh, padded = true }: Props) {
  const insets = useSafeAreaInsets();
  const padding = padded ? 'px-5' : '';
  if (!scroll) {
    return (
      <View className={`flex-1 bg-bg ${padding}`} style={{ paddingTop: insets.top }}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      className={`flex-1 bg-bg ${padding}`}
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
