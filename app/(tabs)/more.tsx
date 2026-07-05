import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import {
  Award, CalendarDays, CheckSquare, Droplets, Flame, Heart,
  Images, KanbanSquare, LineChart, LogOut, Moon, Scale, UserRound,
} from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useDaySummary } from '@/hooks/useDashboard';
import { useUserId } from '@/hooks/useData';
import { useAuth } from '@/stores/auth';

const ITEMS: { href: Href; label: string; icon: React.ComponentType<{ size?: number; color?: string }>; color: string }[] = [
  { href: '/weight', label: 'Poids', icon: Scale, color: colors.brand },
  { href: '/sleep', label: 'Sommeil', icon: Moon, color: colors.violet },
  { href: '/hydration', label: 'Hydratation', icon: Droplets, color: colors.sky },
  { href: '/habits', label: 'Habitudes', icon: CheckSquare, color: colors.warn },
  { href: '/projects', label: 'Projets', icon: KanbanSquare, color: colors.sky },
  { href: '/motivation', label: 'Motivation', icon: Heart, color: colors.danger },
  { href: '/calendar', label: 'Calendrier', icon: CalendarDays, color: colors.brand },
  { href: '/stats', label: 'Statistiques', icon: LineChart, color: colors.warn },
  { href: '/photos', label: 'Photos', icon: Images, color: colors.violet },
  { href: '/achievements', label: 'Succès', icon: Award, color: colors.warn },
  { href: '/profile', label: 'Profil & objectifs', icon: UserRound, color: colors.ink },
];

export default function MoreScreen() {
  const userId = useUserId();
  const s = useDaySummary(userId);
  const logout = useAuth((st) => st.logout);

  return (
    <Screen>
      <Text className="mt-2 text-3xl font-bold tracking-tight text-ink">Plus</Text>

      <Card className="mt-4 flex-row items-center" onPress={() => router.push('/profile')}>
        <Avatar profile={s.profile} size={56} />
        <View className="ml-4 flex-1">
          <Text className="text-lg font-bold text-ink">{s.profile.name}</Text>
          <Text className="text-sm text-mute">Niveau {s.level} · {s.xp} XP</Text>
        </View>
        <View className="flex-row items-center rounded-full bg-warn/15 px-3 py-1.5">
          <Flame size={14} color={colors.warn} />
          <Text className="ml-1 text-sm font-bold text-warn">{s.streak}</Text>
        </View>
      </Card>

      <View className="mt-5 flex-row flex-wrap justify-between">
        {ITEMS.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.href)}
            className="mb-3 w-[31%] items-center rounded-3xl border border-line bg-card py-5"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <item.icon size={24} color={item.color} />
            <Text className="mt-2 text-center text-xs font-semibold text-ink">{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
        className="mt-4 flex-row items-center justify-center rounded-2xl border border-danger/30 py-3.5"
      >
        <LogOut size={16} color={colors.danger} />
        <Text className="ml-2 font-semibold text-danger">Se déconnecter</Text>
      </Pressable>
    </Screen>
  );
}
