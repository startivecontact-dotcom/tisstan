import { bestStreak, currentStreak } from '../streak';

describe('streak', () => {
  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    expect(currentStreak(['2026-01-08', '2026-01-09', '2026-01-10'], '2026-01-10')).toBe(3);
  });

  it('tolère un trou aujourd’hui (journée non finie)', () => {
    expect(currentStreak(['2026-01-08', '2026-01-09'], '2026-01-10')).toBe(2);
  });

  it('retourne 0 si la série est cassée avant hier', () => {
    expect(currentStreak(['2026-01-05'], '2026-01-10')).toBe(0);
  });

  it('trouve la meilleure série historique', () => {
    expect(bestStreak(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-07', '2026-01-08'])).toBe(3);
    expect(bestStreak([])).toBe(0);
  });

  it('ignore les doublons', () => {
    expect(bestStreak(['2026-01-01', '2026-01-01', '2026-01-02'])).toBe(2);
  });
});
