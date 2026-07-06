import type { FoodItem, Meal } from '@/types/models';

export interface MacroTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
}

export const EMPTY_TOTALS: MacroTotals = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sugarG: 0,
  sodiumMg: 0,
};

export function totalsOfFoods(foods: FoodItem[]): MacroTotals {
  return foods.reduce<MacroTotals>(
    (acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      proteinG: acc.proteinG + (f.proteinG || 0),
      carbsG: acc.carbsG + (f.carbsG || 0),
      fatG: acc.fatG + (f.fatG || 0),
      fiberG: acc.fiberG + (f.fiberG || 0),
      sugarG: acc.sugarG + (f.sugarG || 0),
      sodiumMg: acc.sodiumMg + (f.sodiumMg || 0),
    }),
    { ...EMPTY_TOTALS },
  );
}

export function totalsOfMeals(meals: Meal[]): MacroTotals {
  return meals.reduce<MacroTotals>((acc, m) => {
    const t = totalsOfFoods(m.foods);
    return {
      calories: acc.calories + t.calories,
      proteinG: acc.proteinG + t.proteinG,
      carbsG: acc.carbsG + t.carbsG,
      fatG: acc.fatG + t.fatG,
      fiberG: acc.fiberG + t.fiberG,
      sugarG: acc.sugarG + t.sugarG,
      sodiumMg: acc.sodiumMg + t.sodiumMg,
    };
  }, { ...EMPTY_TOTALS });
}

/** IMC = poids / taille². */
export function bmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiLabel(value: number): string {
  if (value <= 0) return '—';
  if (value < 18.5) return 'Insuffisance';
  if (value < 25) return 'Normal';
  if (value < 30) return 'Surpoids';
  return 'Obésité';
}

/** Masse grasse estimée — formule de Deurenberg. */
export function estimatedBodyFat(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female',
): number {
  const b = bmi(weightKg, heightCm);
  if (!b || !age) return 0;
  const fat = 1.2 * b + 0.23 * age - 10.8 * (sex === 'male' ? 1 : 0) - 5.4;
  return Math.max(3, Math.round(fat * 10) / 10);
}

/** Poids idéal — formule de Lorentz. */
export function idealWeight(heightCm: number, sex: 'male' | 'female'): number {
  if (!heightCm) return 0;
  const divisor = sex === 'male' ? 4 : 2.5;
  return Math.round((heightCm - 100 - (heightCm - 150) / divisor) * 10) / 10;
}

export interface GoalSuggestion {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/**
 * Objectifs nutritionnels suggérés :
 * BMR (Mifflin-St Jeor) × 1,5 d'activité, ajusté selon l'objectif de poids
 * (déficit -300 kcal / surplus +250 kcal), protéines 1,8 g/kg,
 * lipides 30 % des calories, le reste en glucides.
 */
export function suggestGoals(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female',
  goalWeightKg: number,
): GoalSuggestion {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  let cal = bmr * 1.5;
  if (goalWeightKg < weightKg - 1) cal -= 300;
  else if (goalWeightKg > weightKg + 1) cal += 250;
  const calories = Math.max(1200, Math.round(cal / 10) * 10);
  const proteinG = Math.round(1.8 * weightKg);
  const fatG = Math.round((calories * 0.3) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { calories, proteinG, carbsG, fatG };
}

export const MEAL_LABELS: Record<Meal['type'], { label: string; emoji: string }> = {
  breakfast: { label: 'Petit déjeuner', emoji: '🍳' },
  lunch: { label: 'Déjeuner', emoji: '🥗' },
  dinner: { label: 'Dîner', emoji: '🍽️' },
  snack: { label: 'Collation', emoji: '🍎' },
};
