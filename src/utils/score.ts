import type { Goals } from '@/types/models';

export interface DayInputs {
  calories: number;
  proteinG: number;
  waterGlasses: number;
  sleepHours: number;
  workoutDone: boolean;
  habitsDone: number;
  habitsTotal: number;
}

/** Ratio borné à 1, avec pénalité de dépassement pour les calories. */
function ratio(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, value / target);
}

function calorieScore(calories: number, target: number): number {
  if (target <= 0 || calories <= 0) return 0;
  const r = calories / target;
  if (r <= 1) return r;
  // Au-delà de l'objectif, on décroît linéairement (200 % = score nul).
  return Math.max(0, 2 - r);
}

/**
 * Score de la journée sur 100 — mélange pondéré nutrition / hydratation /
 * sommeil / sport / habitudes, façon "recovery score" Whoop.
 */
export function dayScore(inputs: DayInputs, goals: Goals): number {
  const parts = [
    { w: 0.25, v: calorieScore(inputs.calories, goals.calories) },
    { w: 0.15, v: ratio(inputs.proteinG, goals.proteinG) },
    { w: 0.15, v: ratio(inputs.waterGlasses, goals.waterGlasses) },
    { w: 0.2, v: ratio(inputs.sleepHours, goals.sleepHours) },
    { w: 0.15, v: inputs.workoutDone ? 1 : 0 },
    {
      w: 0.1,
      v: inputs.habitsTotal > 0 ? inputs.habitsDone / inputs.habitsTotal : 0,
    },
  ];
  const score = parts.reduce((acc, p) => acc + p.w * p.v, 0);
  return Math.round(score * 100);
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Exceptionnel';
  if (score >= 70) return 'Très bon';
  if (score >= 50) return 'Correct';
  if (score >= 30) return 'À améliorer';
  return 'Jour off';
}
