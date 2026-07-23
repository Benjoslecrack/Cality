import type { ExerciseType } from '../types/database';

export type ExerciseLogExportRow = {
  exercise_name: string;
  type: ExerciseType;
  skill_name: string | null;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
  workout_logs: { performed_date: string; session_name: string; rpe: number | null } | null;
};

// Séparateur ";" plutôt que "," : Excel en locale FR utilise la virgule comme
// séparateur décimal, un CSV séparé par virgules s'ouvre alors en une seule
// colonne illisible.
const DELIMITER = ';';

const HEADERS = [
  'date',
  'séance',
  'exercice',
  'skill',
  'type',
  'série',
  'reps',
  'charge_kg',
  'maintien_s',
  'variante',
  'rpe',
];

function csvField(value: string | number | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  return /["\n]/.test(str) || str.includes(DELIMITER) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Une ligne par série réellement loggée, la plus lisible en tableur pour
// retrouver l'historique complet des performances.
export function buildExerciseLogsCsv(rows: ExerciseLogExportRow[]): string {
  const lines = [HEADERS.join(DELIMITER)];
  for (const row of rows) {
    lines.push(
      [
        row.workout_logs?.performed_date ?? '',
        row.workout_logs?.session_name ?? '',
        row.exercise_name,
        row.skill_name ?? '',
        row.type,
        row.set_number,
        row.reps,
        row.weight_kg,
        row.hold_seconds,
        row.progression_variant,
        row.workout_logs?.rpe ?? '',
      ]
        .map(csvField)
        .join(DELIMITER)
    );
  }
  return lines.join('\n');
}
