import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Dumbbell, LayoutGrid, MessageCircle, Salad, Sparkles } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/stores/auth';

export default function TabsLayout() {
  const { userId, hydrated } = useAuth();
  if (hydrated && !userId) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.mute,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: `${colors.card}F2`,
          borderTopColor: colors.line,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: ({ color }) => <Sparkles size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: 'Nutrition', tabBarIcon: ({ color }) => <Salad size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="sport"
        options={{ title: 'Sport', tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="coach"
        options={{ title: 'Coach IA', tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'Plus', tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} /> }}
      />
    </Tabs>
  );
}
