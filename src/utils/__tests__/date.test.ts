import { lastNDays, monthGrid, sleepDuration } from '../date';

describe('date', () => {
  it('calcule la durée de sommeil avec passage de minuit', () => {
    expect(sleepDuration('23:00', '07:00')).toBe(8);
    expect(sleepDuration('00:30', '08:00')).toBe(7.5);
    expect(sleepDuration('22:15', '06:45')).toBe(8.5);
  });

  it('gère les entrées invalides', () => {
    expect(sleepDuration('abc', '07:00')).toBe(0);
  });

  it('retourne n jours ordonnés', () => {
    const days = lastNDays(7);
    expect(days).toHaveLength(7);
    expect(days[6] > days[0]).toBe(true);
  });

  it('construit une grille de mois valide', () => {
    const grid = monthGrid(2026, 6); // juillet 2026
    const flat = grid.flat().filter(Boolean);
    expect(flat).toHaveLength(31);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    // Le 1er juillet 2026 est un mercredi → 2 cases vides avant (lundi, mardi).
    expect(grid[0][2]).toBe('2026-07-01');
  });
});
