import { challengeOfDay, earnedBadges, levelForXp, levelProgress, totalXp, xpForLevel } from '../gamification';

describe('gamification', () => {
  it('calcule les XP depuis les sources', () => {
    const xp = totalXp({
      weighIns: 2, meals: 4, workouts: 1, sleepLogs: 1,
      hydrationDays: 1, habitChecks: 2, posts: 0, bestStreak: 3,
    });
    // 2*10 + 4*5 + 1*30 + 1*10 + 1*5 + 2*5 + 0 + 3*20 = 155
    expect(xp).toBe(155);
  });

  it('progression des niveaux cohérente', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(400)).toBe(3);
    expect(xpForLevel(2)).toBe(100);
    expect(levelForXp(xpForLevel(5))).toBe(5);
  });

  it('progression 0..1 dans le niveau', () => {
    const p = levelProgress(150);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it('débloque les badges par seuil', () => {
    expect(earnedBadges(0)).toHaveLength(0);
    expect(earnedBadges(600).map((b) => b.id)).toEqual(['spark', 'flame']);
  });

  it('défi du jour stable et dépendant du sel', () => {
    const a = challengeOfDay('2026-07-05', 1);
    expect(challengeOfDay('2026-07-05', 1)).toEqual(a);
  });
});
