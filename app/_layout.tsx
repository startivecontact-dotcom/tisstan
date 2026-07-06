import '../global.css';
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { applyTheme, THEMES, themeVars } from '@/constants/theme';
import { useAuth } from '@/stores/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1 },
  },
});

export default function RootLayout() {
  // Thème par utilisateur : Stanne = sombre vert, Tissam = rose poudré 🐰.
  const userId = useAuth((s) => s.userId);
  const palette = THEMES[userId ?? 'stanne'];
  applyTheme(userId);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <View style={[{ flex: 1, backgroundColor: palette.bg }, vars(themeVars(palette))]}>
          <StatusBar style={palette.dark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.bg },
              animation: 'fade_from_bottom',
            }}
          />
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
