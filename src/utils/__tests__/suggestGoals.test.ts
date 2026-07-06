import { suggestGoals } from '../nutrition';

describe('suggestGoals', () => {
  it('applique un déficit quand l’objectif est plus bas que le poids actuel', () => {
    const cut = suggestGoals(82, 178, 28, 'male', 75);
    const maintain = suggestGoals(82, 178, 28, 'male', 82);
    expect(cut.calories).toBeLessThan(maintain.calories);
    expect(maintain.calories - cut.calories).toBe(300);
  });

  it('applique un surplus quand l’objectif est plus haut', () => {
    const bulk = suggestGoals(70, 178, 28, 'male', 78);
    const maintain = suggestGoals(70, 178, 28, 'male', 70);
    expect(bulk.calories).toBe(maintain.calories + 250);
  });

  it('protéines ≈ 1,8 g/kg et macros cohérentes avec les calories', () => {
    const s = suggestGoals(80, 180, 30, 'male', 75);
    expect(s.proteinG).toBe(144);
    const kcalFromMacros = s.proteinG * 4 + s.carbsG * 4 + s.fatG * 9;
    expect(Math.abs(kcalFromMacros - s.calories)).toBeLessThan(20);
  });

  it('besoins plus bas pour les femmes (BMR Mifflin)', () => {
    const m = suggestGoals(70, 170, 30, 'male', 70);
    const f = suggestGoals(70, 170, 30, 'female', 70);
    expect(f.calories).toBeLessThan(m.calories);
  });

  it('ne descend jamais sous 1200 kcal', () => {
    const s = suggestGoals(45, 150, 70, 'female', 40);
    expect(s.calories).toBeGreaterThanOrEqual(1200);
  });
});
