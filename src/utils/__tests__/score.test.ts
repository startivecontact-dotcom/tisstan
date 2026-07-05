import { dayScore, scoreLabel } from '../score';
import { DEFAULT_GOALS } from '../../constants/config';

describe('dayScore', () => {
  it('donne 100 pour une journée parfaite', () => {
    const score = dayScore(
      {
        calories: DEFAULT_GOALS.calories,
        proteinG: DEFAULT_GOALS.proteinG,
        waterGlasses: DEFAULT_GOALS.waterGlasses,
        sleepHours: DEFAULT_GOALS.sleepHours,
        workoutDone: true,
        habitsDone: 3,
        habitsTotal: 3,
      },
      DEFAULT_GOALS,
    );
    expect(score).toBe(100);
  });

  it('donne 0 pour une journée vide', () => {
    const score = dayScore(
      { calories: 0, proteinG: 0, waterGlasses: 0, sleepHours: 0, workoutDone: false, habitsDone: 0, habitsTotal: 0 },
      DEFAULT_GOALS,
    );
    expect(score).toBe(0);
  });

  it('pénalise le dépassement de calories', () => {
    const base = { proteinG: 0, waterGlasses: 0, sleepHours: 0, workoutDone: false, habitsDone: 0, habitsTotal: 0 };
    const atGoal = dayScore({ ...base, calories: DEFAULT_GOALS.calories }, DEFAULT_GOALS);
    const doubled = dayScore({ ...base, calories: DEFAULT_GOALS.calories * 2 }, DEFAULT_GOALS);
    expect(doubled).toBeLessThan(atGoal);
    expect(doubled).toBe(0);
  });

  it('labellise les scores', () => {
    expect(scoreLabel(90)).toBe('Exceptionnel');
    expect(scoreLabel(75)).toBe('Très bon');
    expect(scoreLabel(55)).toBe('Correct');
    expect(scoreLabel(10)).toBe('Jour off');
  });
});
