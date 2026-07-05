import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/stores/auth';
import { colors } from '@/constants/theme';

export default function Index() {
  const { userId, hydrated } = useAuth();
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  return <Redirect href={userId ? '/(tabs)' : '/login'} />;
}
