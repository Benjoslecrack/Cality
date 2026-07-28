import { isStreakActive, mondayOfWeek } from './streak';

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

describe('mondayOfWeek', () => {
  it('renvoie le même jour si on est déjà lundi', () => {
    expect(mondayOfWeek(d(2026, 7, 27))).toEqual(d(2026, 7, 27)); // 27/07/2026 est un lundi
  });

  it('recule jusqu’au lundi pour un jour en milieu de semaine', () => {
    expect(mondayOfWeek(d(2026, 7, 30))).toEqual(d(2026, 7, 27)); // jeudi -> lundi de la même semaine
  });

  it('gère dimanche comme fin de semaine (pas début)', () => {
    expect(mondayOfWeek(d(2026, 8, 2))).toEqual(d(2026, 7, 27)); // dimanche -> lundi précédent, pas lui-même
  });
});

describe('isStreakActive', () => {
  it("n'est jamais actif s'il n'y a aucune séance faite", () => {
    expect(isStreakActive(null, d(2026, 7, 28))).toBe(false);
  });

  it('reste actif pour une séance faite plus tôt dans la semaine courante', () => {
    expect(isStreakActive(d(2026, 7, 27), d(2026, 7, 30))).toBe(true);
  });

  it("reste actif si la dernière séance date de la semaine précédente (pas de trou complet)", () => {
    // Dernière séance : lundi 20/07 (semaine précédente). Aujourd'hui : jeudi 30/07.
    expect(isStreakActive(d(2026, 7, 20), d(2026, 7, 30))).toBe(true);
  });

  it("casse dès qu'une semaine complète s'est écoulée sans séance", () => {
    // Dernière séance : lundi 13/07. Semaine du 20/07 entièrement vide.
    // Aujourd'hui : jeudi 30/07 -> 2 semaines d'écart.
    expect(isStreakActive(d(2026, 7, 13), d(2026, 7, 30))).toBe(false);
  });

  it("n'est pas cassé par un simple jour de repos (pas une semaine entière)", () => {
    // Séance lundi, rien mardi/mercredi, reprise jeudi de la même semaine :
    // toujours dans la même semaine calendaire -> actif.
    expect(isStreakActive(d(2026, 7, 27), d(2026, 7, 29))).toBe(true);
  });
});
