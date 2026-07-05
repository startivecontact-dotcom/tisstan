import { bmi, bmiLabel, estimatedBodyFat, idealWeight, totalsOfFoods } from '../nutrition';
import type { FoodItem } from '../../types/models';

describe('nutrition', () => {
  const foods: FoodItem[] = [
    { name: 'Poulet', quantity: '150 g', calories: 250, proteinG: 45, carbsG: 0, fatG: 6, fiberG: 0, sugarG: 0, sodiumMg: 100 },
    { name: 'Riz', quantity: '150 g', calories: 195, proteinG: 4, carbsG: 42, fatG: 1, fiberG: 1, sugarG: 0, sodiumMg: 2 },
  ];

  it('additionne les macros des aliments', () => {
    const t = totalsOfFoods(foods);
    expect(t.calories).toBe(445);
    expect(t.proteinG).toBe(49);
    expect(t.carbsG).toBe(42);
    expect(t.sodiumMg).toBe(102);
  });

  it('calcule un IMC correct', () => {
    expect(bmi(80, 180)).toBeCloseTo(24.7, 1);
    expect(bmi(0, 180)).toBe(0);
  });

  it('classe l’IMC', () => {
    expect(bmiLabel(17)).toBe('Insuffisance');
    expect(bmiLabel(22)).toBe('Normal');
    expect(bmiLabel(27)).toBe('Surpoids');
    expect(bmiLabel(32)).toBe('Obésité');
  });

  it('estime la masse grasse (Deurenberg)', () => {
    const fat = estimatedBodyFat(80, 180, 28, 'male');
    expect(fat).toBeGreaterThan(10);
    expect(fat).toBeLessThan(30);
  });

  it('calcule le poids idéal (Lorentz)', () => {
    expect(idealWeight(180, 'male')).toBeCloseTo(72.5, 1);
    expect(idealWeight(0, 'male')).toBe(0);
  });
});
