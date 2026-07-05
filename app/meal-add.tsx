import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, ImageIcon, Plus, Trash2, X } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useUpsert, useUserId } from '@/hooks/useData';
import { analyzeMealPhoto } from '@/services/ai';
import { pickImage, uploadPhoto } from '@/services/photos';
import type { FoodItem, Meal, MealType } from '@/types/models';
import { todayISO } from '@/utils/date';
import { uid } from '@/utils/id';
import { MEAL_LABELS } from '@/utils/nutrition';

interface FoodForm {
  name: string;
  quantity: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  sugarG: string;
  sodiumMg: string;
}

const EMPTY_FOOD: FoodForm = {
  name: '', quantity: '', calories: '', proteinG: '', carbsG: '', fatG: '',
  fiberG: '', sugarG: '', sodiumMg: '',
};

export default function MealAddScreen() {
  const userId = useUserId();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayISO();
  const upsertMeal = useUpsert<Meal>('meals');

  const [type, setType] = useState<MealType>('lunch');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [photo, setPhoto] = useState<{ uri: string; base64: string | null } | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset } = useForm<FoodForm>({ defaultValues: EMPTY_FOOD });

  const addFood = handleSubmit((v) => {
    const n = (s: string) => Number(s.replace(',', '.')) || 0;
    setFoods((prev) => [...prev, {
      name: v.name, quantity: v.quantity || '1 portion',
      calories: n(v.calories), proteinG: n(v.proteinG), carbsG: n(v.carbsG), fatG: n(v.fatG),
      fiberG: n(v.fiberG), sugarG: n(v.sugarG), sodiumMg: n(v.sodiumMg),
    }]);
    reset(EMPTY_FOOD);
  });

  const scanPhoto = async (useCamera: boolean) => {
    const img = await pickImage(useCamera);
    if (!img) return;
    setPhoto(img);
    if (img.base64) {
      setScanning(true);
      try {
        setPhotoAnalysis(await analyzeMealPhoto(img.base64));
      } finally {
        setScanning(false);
      }
    }
  };

  const save = async () => {
    if (foods.length === 0 && !photo) return;
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadPhoto(userId, photo.uri, 'meals');
      await upsertMeal.mutateAsync({
        id: uid(), userId, createdAt: Date.now(), date, type, foods,
        photoUrl, aiAnalysis: photoAnalysis ?? undefined,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-ink">Ajouter un repas</Text>
        <Pressable onPress={() => router.back()} className="p-2">
          <X size={22} color={colors.mute} />
        </Pressable>
      </View>

      {/* Type de repas */}
      <View className="mt-4 flex-row flex-wrap gap-2">
        {(Object.keys(MEAL_LABELS) as MealType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            className={`rounded-full border px-4 py-2 ${type === t ? 'border-brand bg-brand/15' : 'border-line bg-surface'}`}
          >
            <Text className={`text-sm font-semibold ${type === t ? 'text-brand' : 'text-mute'}`}>
              {MEAL_LABELS[t].emoji} {MEAL_LABELS[t].label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Scan photo IA */}
      <Card className="mt-5">
        <Text className="text-base font-bold text-ink">📸 Scanner le repas</Text>
        <Text className="mt-1 text-sm text-mute">L’IA reconnaît les aliments et estime les nutriments.</Text>
        <View className="mt-3 flex-row gap-3">
          <Pressable onPress={() => scanPhoto(true)} className="flex-1 flex-row items-center justify-center rounded-2xl bg-surface py-3">
            <Camera size={18} color={colors.brand} />
            <Text className="ml-2 font-semibold text-ink">Caméra</Text>
          </Pressable>
          <Pressable onPress={() => scanPhoto(false)} className="flex-1 flex-row items-center justify-center rounded-2xl bg-surface py-3">
            <ImageIcon size={18} color={colors.sky} />
            <Text className="ml-2 font-semibold text-ink">Galerie</Text>
          </Pressable>
        </View>
        {photo ? <Image source={{ uri: photo.uri }} className="mt-3 h-44 w-full rounded-2xl" resizeMode="cover" /> : null}
        {scanning ? <Text className="mt-3 text-sm text-brand">✨ Analyse de la photo en cours…</Text> : null}
        {photoAnalysis ? (
          <View className="mt-3 rounded-2xl border border-brand/25 bg-brand/5 p-3">
            <Text className="text-sm leading-5 text-ink">{photoAnalysis}</Text>
          </View>
        ) : null}
      </Card>

      {/* Aliments ajoutés */}
      {foods.map((f, i) => (
        <Card key={i} className="mt-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-ink">{f.name} <Text className="text-mute">· {f.quantity}</Text></Text>
            <Text className="mt-0.5 text-xs text-mute">
              {f.calories} kcal · {f.proteinG}P / {f.carbsG}G / {f.fatG}L
            </Text>
          </View>
          <Pressable onPress={() => setFoods((prev) => prev.filter((_, j) => j !== i))}>
            <Trash2 size={18} color={colors.danger} />
          </Pressable>
        </Card>
      ))}

      {/* Formulaire aliment */}
      <Card className="mt-4">
        <Text className="mb-3 text-base font-bold text-ink">Ajouter un aliment</Text>
        <FormInput control={control} name="name" label="Nom" placeholder="Poulet grillé" rules={{ required: 'Nom requis' }} />
        <FormInput control={control} name="quantity" label="Quantité" placeholder="150 g" />
        <View className="flex-row gap-3">
          <View className="flex-1"><FormInput control={control} name="calories" label="Kcal" placeholder="250" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="proteinG" label="Prot (g)" placeholder="30" keyboardType="numeric" /></View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1"><FormInput control={control} name="carbsG" label="Gluc (g)" placeholder="20" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="fatG" label="Lip (g)" placeholder="8" keyboardType="numeric" /></View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1"><FormInput control={control} name="fiberG" label="Fibres" placeholder="3" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="sugarG" label="Sucre" placeholder="2" keyboardType="numeric" /></View>
          <View className="flex-1"><FormInput control={control} name="sodiumMg" label="Sodium" placeholder="120" keyboardType="numeric" /></View>
        </View>
        <Pressable onPress={addFood} className="mt-1 flex-row items-center justify-center rounded-2xl border border-brand/40 py-3">
          <Plus size={16} color={colors.brand} />
          <Text className="ml-1.5 font-semibold text-brand">Ajouter l’aliment</Text>
        </Pressable>
      </Card>

      <View className="mt-5">
        <Button
          title={`Enregistrer le repas (${foods.length} aliment${foods.length > 1 ? 's' : ''})`}
          onPress={save}
          loading={saving}
          disabled={foods.length === 0 && !photo}
        />
      </View>
    </Screen>
  );
}
