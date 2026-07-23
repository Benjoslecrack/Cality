import type { ExerciseType } from '../types/database';

type ExerciseTargetFields = {
  type: ExerciseType;
  target_sets: number;
  target_reps: number | null;
  target_weight_kg: number | null;
  target_hold_seconds: number | null;
  progression_variant: string | null;
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  reps_weight: 'Séries x reps x charge',
  isometric: 'Isométrique (temps de maintien)',
  progression: 'Progression (variante/niveau)',
};

export function formatExerciseTarget(exercise: ExerciseTargetFields): string {
  switch (exercise.type) {
    case 'reps_weight': {
      const weight = exercise.target_weight_kg ? ` @${exercise.target_weight_kg}kg` : '';
      return `${exercise.target_sets} x ${exercise.target_reps ?? '?'} reps${weight}`;
    }
    case 'isometric':
      return `${exercise.target_sets} x ${exercise.target_hold_seconds ?? '?'}s`;
    case 'progression':
      return `${exercise.target_sets} série${exercise.target_sets > 1 ? 's' : ''}${
        exercise.progression_variant ? ` · ${exercise.progression_variant}` : ''
      }`;
  }
}

type LoggedSetFields = {
  type: ExerciseType;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
};

// Résumé d'une série réellement effectuée (utilisé dans l'écran de logging).
export function formatSetValue(set: LoggedSetFields): string {
  switch (set.type) {
    case 'reps_weight': {
      const weight = set.weight_kg ? ` @${set.weight_kg}kg` : '';
      return `${set.reps ?? '?'} reps${weight}`;
    }
    case 'isometric':
      return `${set.hold_seconds ?? '?'}s`;
    case 'progression': {
      const reps = set.reps ? ` · ${set.reps} reps` : '';
      return `${set.progression_variant ?? 'Tentative'}${reps}`;
    }
  }
}
