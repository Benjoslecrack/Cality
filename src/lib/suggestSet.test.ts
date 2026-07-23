import { computeSuggestion } from './suggestSet';

const lastRepsWeight = { reps: 8, weight_kg: 60, hold_seconds: null, progression_variant: null };
const lastHold = { reps: null, weight_kg: null, hold_seconds: 15, progression_variant: null };
const lastProgression = { reps: 2, weight_kg: null, hold_seconds: null, progression_variant: 'kipping' };

describe('computeSuggestion', () => {
  it('reprend la même charge/reps si le RPE précédent est élevé (pas de RPE bas)', () => {
    const suggestion = computeSuggestion(lastRepsWeight, 9, 'reps_weight');
    expect(suggestion).toMatchObject({ reps: 8, weight_kg: 60, bumped: false, basedOnRpe: 9 });
  });

  it('propose +1 rep si la dernière séance était à RPE bas', () => {
    const suggestion = computeSuggestion(lastRepsWeight, 5, 'reps_weight');
    expect(suggestion).toMatchObject({ reps: 9, weight_kg: 60, bumped: true, basedOnRpe: 5 });
  });

  it('ne bump pas au seuil exact de 6 (RPE bas = <=6)', () => {
    const suggestion = computeSuggestion(lastRepsWeight, 6, 'reps_weight');
    expect(suggestion.bumped).toBe(true);
    expect(suggestion.reps).toBe(9);
  });

  it('ne bump pas sans RPE renseigné sur la dernière séance', () => {
    const suggestion = computeSuggestion(lastRepsWeight, null, 'reps_weight');
    expect(suggestion).toMatchObject({ reps: 8, weight_kg: 60, bumped: false, basedOnRpe: null });
  });

  it('propose +5s pour un isométrique à RPE bas', () => {
    const suggestion = computeSuggestion(lastHold, 4, 'isometric');
    expect(suggestion).toMatchObject({ hold_seconds: 20, reps: null, bumped: true });
  });

  it('reprend la même variante de progression, +1 rep si RPE bas', () => {
    const suggestion = computeSuggestion(lastProgression, 5, 'progression');
    expect(suggestion).toMatchObject({ reps: 3, progression_variant: 'kipping', bumped: true });
  });

  it('ne casse rien si aucune valeur précédente disponible', () => {
    const suggestion = computeSuggestion(
      { reps: null, weight_kg: null, hold_seconds: null, progression_variant: null },
      5,
      'reps_weight'
    );
    expect(suggestion.reps).toBeNull();
    expect(suggestion.weight_kg).toBeNull();
  });
});
