import { formatExerciseTarget, formatSetValue } from './exerciseFormat';

describe('formatExerciseTarget', () => {
  it('formate un objectif séries x reps x charge avec poids', () => {
    expect(
      formatExerciseTarget({
        type: 'reps_weight',
        target_sets: 4,
        target_reps: 8,
        target_weight_kg: 60,
        target_hold_seconds: null,
        progression_variant: null,
      })
    ).toBe('4 x 8 reps @60kg');
  });

  it('omet le poids si non renseigné (poids du corps)', () => {
    expect(
      formatExerciseTarget({
        type: 'reps_weight',
        target_sets: 3,
        target_reps: 10,
        target_weight_kg: null,
        target_hold_seconds: null,
        progression_variant: null,
      })
    ).toBe('3 x 10 reps');
  });

  it('formate un objectif isométrique en temps de maintien', () => {
    expect(
      formatExerciseTarget({
        type: 'isometric',
        target_sets: 3,
        target_reps: null,
        target_weight_kg: null,
        target_hold_seconds: 20,
        progression_variant: null,
      })
    ).toBe('3 x 20s');
  });

  it('formate un objectif progression avec variante, accord singulier/pluriel', () => {
    expect(
      formatExerciseTarget({
        type: 'progression',
        target_sets: 1,
        target_reps: null,
        target_weight_kg: null,
        target_hold_seconds: null,
        progression_variant: 'kipping',
      })
    ).toBe('1 série · kipping');
    expect(
      formatExerciseTarget({
        type: 'progression',
        target_sets: 3,
        target_reps: null,
        target_weight_kg: null,
        target_hold_seconds: null,
        progression_variant: null,
      })
    ).toBe('3 séries');
  });
});

describe('formatSetValue', () => {
  it('formate une série séries x reps x charge effectuée', () => {
    expect(
      formatSetValue({ type: 'reps_weight', reps: 8, weight_kg: 60, hold_seconds: null, progression_variant: null })
    ).toBe('8 reps @60kg');
  });

  it('formate une série au poids du corps sans charge', () => {
    expect(
      formatSetValue({ type: 'reps_weight', reps: 10, weight_kg: null, hold_seconds: null, progression_variant: null })
    ).toBe('10 reps');
  });

  it('formate une série isométrique', () => {
    expect(
      formatSetValue({ type: 'isometric', reps: null, weight_kg: null, hold_seconds: 22, progression_variant: null })
    ).toBe('22s');
  });

  it('formate une série de progression avec variante et reps', () => {
    expect(
      formatSetValue({ type: 'progression', reps: 3, weight_kg: null, hold_seconds: null, progression_variant: 'kipping' })
    ).toBe('kipping · 3 reps');
  });

  it('retombe sur "Tentative" si aucune variante renseignée', () => {
    expect(
      formatSetValue({ type: 'progression', reps: null, weight_kg: null, hold_seconds: null, progression_variant: null })
    ).toBe('Tentative');
  });
});
