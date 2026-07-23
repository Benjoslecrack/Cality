import { isRecordBeaten, progressPoint } from './progressValue';

describe('progressPoint', () => {
  it('privilégie la charge pour un exercice séries x reps x charge', () => {
    expect(progressPoint({ type: 'reps_weight', reps: 8, weight_kg: 60, hold_seconds: null })).toEqual({
      value: 60,
      unit: 'kg',
    });
  });

  it('retombe sur les reps si aucune charge renseignée (poids du corps)', () => {
    expect(progressPoint({ type: 'reps_weight', reps: 10, weight_kg: null, hold_seconds: null })).toEqual({
      value: 10,
      unit: 'reps',
    });
  });

  it('utilise le temps de maintien pour un isométrique', () => {
    expect(progressPoint({ type: 'isometric', reps: null, weight_kg: null, hold_seconds: 22 })).toEqual({
      value: 22,
      unit: 's',
    });
  });

  it('utilise les reps pour une progression', () => {
    expect(progressPoint({ type: 'progression', reps: 3, weight_kg: null, hold_seconds: null })).toEqual({
      value: 3,
      unit: 'reps',
    });
  });

  it('renvoie null si aucune valeur exploitable', () => {
    expect(progressPoint({ type: 'reps_weight', reps: null, weight_kg: null, hold_seconds: null })).toBeNull();
    expect(progressPoint({ type: 'isometric', reps: null, weight_kg: null, hold_seconds: null })).toBeNull();
    expect(progressPoint({ type: 'progression', reps: null, weight_kg: null, hold_seconds: null })).toBeNull();
  });
});

describe('isRecordBeaten', () => {
  it("n'est jamais un record sans historique préalable", () => {
    expect(isRecordBeaten(50, null)).toBe(false);
  });

  it('est un record si la nouvelle valeur dépasse le précédent record', () => {
    expect(isRecordBeaten(65, 60)).toBe(true);
  });

  it("n'est pas un record en cas d'égalité ou de baisse", () => {
    expect(isRecordBeaten(60, 60)).toBe(false);
    expect(isRecordBeaten(55, 60)).toBe(false);
  });

  it('gère une nouvelle valeur absente', () => {
    expect(isRecordBeaten(null, 60)).toBe(false);
  });
});
