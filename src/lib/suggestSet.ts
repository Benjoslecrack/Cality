import type { ExerciseType } from '../types/database';

export type SetSuggestion = {
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
  bumped: boolean; // true si +1 rep/+5s appliqué (dernière séance à RPE bas)
  basedOnRpe: number | null;
};

export const RPE_LOW_THRESHOLD = 6; // sur 10 : en dessous, on propose de pousser un peu plus

type LastSet = {
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
};

// Règle de suggestion (jamais appliquée automatiquement, juste préremplie) :
// reprend la dernière performance, pousse légèrement (+1 rep / +5s) si cette
// dernière séance a été faite à RPE bas.
export function computeSuggestion(last: LastSet, rpe: number | null, type: ExerciseType): SetSuggestion {
  const bump = rpe != null && rpe <= RPE_LOW_THRESHOLD;

  if (type === 'isometric') {
    return {
      reps: null,
      weight_kg: null,
      hold_seconds: last.hold_seconds != null ? last.hold_seconds + (bump ? 5 : 0) : null,
      progression_variant: null,
      bumped: bump,
      basedOnRpe: rpe,
    };
  }

  return {
    reps: last.reps != null ? last.reps + (bump ? 1 : 0) : null,
    weight_kg: last.weight_kg,
    hold_seconds: null,
    progression_variant: last.progression_variant,
    bumped: bump,
    basedOnRpe: rpe,
  };
}
