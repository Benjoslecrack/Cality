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
