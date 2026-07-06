import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { clearUserData, upsertDoc } from '@/services/data/repo';
import { seedDemoUser } from '@/services/data/seed';
import { useAuth } from '@/stores/auth';
import type { WeightEntry } from '@/types/models';
import { dayjs, todayISO } from '@/utils/date';
import { uid } from '@/utils/id';
import { suggestGoals } from '@/utils/nutrition';

interface OnboardingForm {
  name: string;
  birthYear: string;
  heightCm: string;
  currentWeight: string;
  goalWeight: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  waterGlasses: string;
  sleepHours: string;
  workoutsPerWeek: string;
}

const STEPS = ['Toi', 'Tes objectifs', 'C’est parti'] as const;

/** Première utilisation : infos personnelles, objectifs, données de démo. */
export default function OnboardingScreen() {
  const { userId, profile, updateProfile } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [withDemo, setWithDemo] = useState(false);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, getValues, setValue, trigger } = useForm<OnboardingForm>({
    defaultValues: {
      name: profile?.name ?? '',
      birthYear: '', heightCm: '', currentWeight: '', goalWeight: '',
      calories: '', proteinG: '', carbsG: '', fatG: '',
      waterGlasses: '8', sleepHours: '8', workoutsPerWeek: '4',
    },
  });

  if (!userId || !profile) return null;

  const n = (s: string, fallback = 0) => Number(String(s).replace(',', '.')) || fallback;

  const autoCalc = () => {
    const v = getValues();
    const weight = n(v.currentWeight);
    const height = n(v.heightCm);
    const age = v.birthYear ? dayjs().year() - n(v.birthYear) : 0;
    if (!weight || !height || !age) return;
    const s = suggestGoals(weight, height, age, sex, n(v.goalWeight, weight));
    setValue('calories', String(s.calories));
    setValue('proteinG', String(s.proteinG));
    setValue('carbsG', String(s.carbsG));
    setValue('fatG', String(s.fatG));
  };

  const nextFromStep1 = async () => {
    const ok = await trigger(['name', 'birthYear', 'heightCm', 'currentWeight']);
    if (ok) setStep(1);
  };

  const nextFromStep2 = async () => {
    const ok = await trigger(['goalWeight', 'calories', 'proteinG']);
    if (ok) setStep(2);
  };

  const finish = handleSubmit(async (v) => {
    setSaving(true);
    try {
      const currentWeight = n(v.currentWeight);
      await updateProfile({
        name: v.name.trim() || profile.name,
        sex,
        birthYear: n(v.birthYear, 1998),
        heightCm: n(v.heightCm, 175),
        onboarded: true,
        goals: {
          ...profile.goals,
          weightKg: n(v.goalWeight, currentWeight),
          calories: n(v.calories, 2200),
          proteinG: n(v.proteinG, 150),
          carbsG: n(v.carbsG, 220),
          fatG: n(v.fatG, 70),
          waterGlasses: n(v.waterGlasses, 8),
          sleepHours: n(v.sleepHours, 8),
          workoutsPerWeek: n(v.workoutsPerWeek, 4),
        },
      });

      // Repartir propre : on efface les éventuelles données existantes,
      // puis on seed la démo si demandé, et on enregistre la première pesée.
      await clearUserData(userId);
      if (withDemo) await seedDemoUser(userId, currentWeight + 1.5);
      await upsertDoc<WeightEntry>('weight', {
        id: uid(), userId, createdAt: Date.now(), date: todayISO(), weightKg: currentWeight,
      });
      await qc.invalidateQueries();
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  });

  return (
    <Screen>
      {/* En-tête + progression */}
      <Animated.View entering={FadeInDown.duration(400)} className="mt-4 items-center">
        <Avatar profile={profile} size={72} />
        <Text className="mt-3 text-2xl font-bold text-ink">Bienvenue {profile.name} !</Text>
        <Text className="mt-1 text-sm text-mute">Configurons ton espace en 3 étapes</Text>
        <View className="mt-4 flex-row gap-2">
          {STEPS.map((label, i) => (
            <View key={label} className="items-center">
              <View
                className="h-2 w-16 rounded-full"
                style={{ backgroundColor: i <= step ? colors.brand : colors.line }}
              />
              <Text className={`mt-1 text-[10px] font-semibold ${i <= step ? 'text-brand' : 'text-mute'}`}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Étape 1 — Infos personnelles */}
      {step === 0 ? (
        <Animated.View entering={FadeInRight.duration(300)}>
          <Card className="mt-6">
            <Text className="mb-3 text-base font-bold text-ink">Parle-nous de toi</Text>
            <FormInput control={control} name="name" label="Prénom" placeholder={profile.name}
              rules={{ required: 'Prénom requis' }} />
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-mute">Sexe</Text>
            <View className="mb-3 flex-row gap-2">
              {([['male', 'Homme'], ['female', 'Femme']] as const).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setSex(key)}
                  className={`flex-1 items-center rounded-2xl border py-3 ${sex === key ? 'border-brand bg-brand/15' : 'border-line bg-surface'}`}
                >
                  <Text className={`font-semibold ${sex === key ? 'text-brand' : 'text-mute'}`}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormInput control={control} name="birthYear" label="Année de naissance" placeholder="1998"
                  keyboardType="number-pad"
                  rules={{ required: 'Requis', pattern: { value: /^(19|20)\d{2}$/, message: 'Ex. 1998' } }} />
              </View>
              <View className="flex-1">
                <FormInput control={control} name="heightCm" label="Taille (cm)" placeholder="178"
                  keyboardType="numeric" rules={{ required: 'Requis' }} />
              </View>
            </View>
            <FormInput control={control} name="currentWeight" label="Poids actuel (kg)" placeholder="78.5"
              keyboardType="decimal-pad" rules={{ required: 'Requis' }} />
            <Button title="Continuer" onPress={nextFromStep1} />
          </Card>
        </Animated.View>
      ) : null}

      {/* Étape 2 — Objectifs */}
      {step === 1 ? (
        <Animated.View entering={FadeInRight.duration(300)}>
          <Card className="mt-6">
            <Text className="mb-3 text-base font-bold text-ink">Tes objectifs</Text>
            <FormInput control={control} name="goalWeight" label="Poids objectif (kg)" placeholder="75"
              keyboardType="decimal-pad" rules={{ required: 'Requis' }} />

            <Pressable
              onPress={autoCalc}
              className="mb-3 flex-row items-center justify-center rounded-2xl border border-brand/40 bg-brand/5 py-3"
            >
              <Sparkles size={16} color={colors.brand} />
              <Text className="ml-2 font-semibold text-brand">Calculer mes besoins automatiquement</Text>
            </Pressable>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormInput control={control} name="calories" label="Calories / jour" placeholder="2200"
                  keyboardType="numeric" rules={{ required: 'Requis' }} />
              </View>
              <View className="flex-1">
                <FormInput control={control} name="proteinG" label="Protéines (g)" placeholder="140"
                  keyboardType="numeric" rules={{ required: 'Requis' }} />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormInput control={control} name="carbsG" label="Glucides (g)" placeholder="220" keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <FormInput control={control} name="fatG" label="Lipides (g)" placeholder="70" keyboardType="numeric" />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormInput control={control} name="waterGlasses" label="Verres d’eau" keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <FormInput control={control} name="sleepHours" label="Sommeil (h)" keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <FormInput control={control} name="workoutsPerWeek" label="Séances/sem" keyboardType="numeric" />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Retour" variant="secondary" onPress={() => setStep(0)} />
              </View>
              <View className="flex-[2]">
                <Button title="Continuer" onPress={nextFromStep2} />
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      {/* Étape 3 — Récap + démo */}
      {step === 2 ? (
        <Animated.View entering={FadeInRight.duration(300)}>
          <Card className="mt-6">
            <Text className="mb-2 text-base font-bold text-ink">Tout est prêt 🎯</Text>
            <Text className="text-sm leading-6 text-mute">
              {getValues('name')} · {n(getValues('currentWeight'))} kg → objectif {n(getValues('goalWeight'))} kg{'\n'}
              {n(getValues('calories'))} kcal · {n(getValues('proteinG'))} g protéines ·{' '}
              {n(getValues('workoutsPerWeek'))} séances/sem
            </Text>
            <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-surface p-3">
              <View className="flex-1 pr-3">
                <Text className="font-semibold text-ink">Données de démonstration</Text>
                <Text className="mt-0.5 text-xs text-mute">
                  Ajoute 3 semaines d’historique fictif pour explorer l’app. Désactive pour partir de zéro (recommandé).
                </Text>
              </View>
              <Switch
                value={withDemo}
                onValueChange={setWithDemo}
                trackColor={{ true: colors.brandDim, false: colors.line }}
                thumbColor={colors.ink}
              />
            </View>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Button title="Retour" variant="secondary" onPress={() => setStep(1)} />
              </View>
              <View className="flex-[2]">
                <Button title="Commencer 🚀" onPress={finish} loading={saving} />
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}
    </Screen>
  );
}
