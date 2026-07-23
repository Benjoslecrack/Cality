import type { ExerciseType } from '../types/database';

type LoggedFields = {
  type: ExerciseType;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
};

// Réduit une série loggée à une seule valeur numérique comparable dans le temps
// (charge en kg, temps de maintien en secondes, ou reps selon ce qui est rempli).
export function progressPoint(log: LoggedFields): { value: number; unit: string } | null {
  switch (log.type) {
    case 'reps_weight':
      if (log.weight_kg != null) return { value: log.weight_kg, unit: 'kg' };
      if (log.reps != null) return { value: log.reps, unit: 'reps' };
      return null;
    case 'isometric':
      return log.hold_seconds != null ? { value: log.hold_seconds, unit: 's' } : null;
    case 'progression':
      return log.reps != null ? { value: log.reps, unit: 'reps' } : null;
  }
}
