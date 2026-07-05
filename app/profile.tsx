import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Camera, ChevronLeft } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors } from '@/constants/theme';
import { cancelAllReminders, scheduleDailyReminders } from '@/services/notifications';
import { pickImage, uploadPhoto } from '@/services/photos';
import { useAuth } from '@/stores/auth';
import { defaultProfile } from '@/services/data/profiles';

interface GoalsForm {
  name: string;
  heightCm: string;
  weightKg: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  waterGlasses: string;
  sleepHours: string;
  workoutsPerWeek: string;
}

export default function ProfileScreen() {
  const { userId, profile: stored, updateProfile } = useAuth();
  const profile = stored ?? (userId ? defaultProfile(userId) : null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifOn, setNotifOn] = useState(false);

  const { control, handleSubmit } = useForm<GoalsForm>({
    defaultValues: profile
      ? {
          name: profile.name,
          heightCm: String(profile.heightCm ?? 178),
          weightKg: String(profile.goals.weightKg),
          calories: String(profile.goals.calories),
          proteinG: String(profile.goals.proteinG),
          carbsG: String(profile.goals.carbsG),
          fatG: String(profile.goals.fatG),
          waterGlasses: String(profile.goals.waterGlasses),
          sleepHours: String(profile.goals.sleepHours),
          workoutsPerWeek: String(profile.goals.workoutsPerWeek),
        }
      : undefined,
  });

  if (!profile || !userId) return null;

  const changePhoto = async () => {
    const img = await pickImage(false);
    if (!img) return;
    const url = await uploadPhoto(userId, img.uri, 'avatars');
    await updateProfile({ photoUrl: url });
  };

  const save = handleSubmit(async (v) => {
    setSaving(true);
    try {
      const n = (s: string, fallback: number) => Number(s.replace(',', '.')) || fallback;
      await updateProfile({
        name: v.name || profile.name,
        heightCm: n(v.heightCm, 178),
        goals: {
          ...profile.goals,
          weightKg: n(v.weightKg, profile.goals.weightKg),
          calories: n(v.calories, profile.goals.calories),
          proteinG: n(v.proteinG, profile.goals.proteinG),
          carbsG: n(v.carbsG, profile.goals.carbsG),
          fatG: n(v.fatG, profile.goals.fatG),
          waterGlasses: n(v.waterGlasses, profile.goals.waterGlasses),
          sleepHours: n(v.sleepHours, profile.goals.sleepHours),
          workoutsPerWeek: n(v.workoutsPerWeek, profile.goals.workoutsPerWeek),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  });

  const toggleNotifications = async (on: boolean) => {
    setNotifOn(on);
    if (on) {
      const ok = await scheduleDailyReminders();
      if (!ok) setNotifOn(false);
    } else {
      await cancelAllReminders();
    }
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()} className="mt-2 flex-row items-center self-start py-2 pr-4">
        <ChevronLeft size={22} color={colors.ink} />
        <Text className="text-2xl font-bold text-ink">Profil</Text>
      </Pressable>

      <View className="mt-4 items-center">
        <Pressable onPress={changePhoto}>
          <Avatar profile={profile} size={96} />
          <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-brand">
            <Camera size={16} color={colors.bg} />
          </View>
        </Pressable>
        <Text className="mt-3 text-xl font-bold text-ink">{profile.name}</Text>
      </View>

      <SectionTitle title="Informations" />
      <Card>
        <FormInput control={control} name="name" label="Nom affiché" placeholder="Stanne" />
        <FormInput control={control} name="heightCm" label="Taille (cm)" placeholder="178" keyboardType="numeric" />
      </Card>

      <SectionTitle title="Objectifs" />
      <Card>
        <View className="flex-row gap-3">
          <View className="flex-1"><FormInput control={control} name="weightKg" label="Poids (kg)" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="calories" label="Calories" keyboardType="numeric" /></View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1"><FormInput control={control} name="proteinG" label="Protéines (g)" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="carbsG" label="Glucides (g)" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="fatG" label="Lipides (g)" keyboardType="numeric" /></View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1"><FormInput control={control} name="waterGlasses" label="Verres d'eau" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="sleepHours" label="Sommeil (h)" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="workoutsPerWeek" label="Séances/sem" keyboardType="numeric" /></View>
        </View>
        <Button title={saved ? 'Enregistré ✓' : 'Enregistrer'} onPress={save} loading={saving} />
      </Card>

      <SectionTitle title="Notifications" />
      <Card className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-semibold text-ink">Rappels quotidiens</Text>
          <Text className="mt-0.5 text-xs text-mute">
            Pesée 7h30 · repas · hydratation 14h · sport 17h30 · sommeil 22h15
          </Text>
        </View>
        <Switch
          value={notifOn}
          onValueChange={toggleNotifications}
          trackColor={{ true: colors.brandDim, false: colors.line }}
          thumbColor={colors.ink}
        />
      </Card>
    </Screen>
  );
}
