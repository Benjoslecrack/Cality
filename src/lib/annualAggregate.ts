import type { ExerciseType } from '../types/database';

type LogEntry = {
  exercise_name: string;
  type: ExerciseType;
  reps: number | null;
  hold_seconds: number | null;
  workout_logs: { performed_date: string } | null;
};

export type AnnualTotals = { totalReps: number; totalHoldSeconds: number };

// Les isométries (temps de maintien) n'ont pas de sens additionnées à des
// reps — compteur séparé, cf. brief.
export function aggregateAnnualTotals(entries: LogEntry[]): AnnualTotals {
  let totalReps = 0;
  let totalHoldSeconds = 0;
  for (const entry of entries) {
    if (entry.type === 'isometric') {
      totalHoldSeconds += entry.hold_seconds ?? 0;
    } else {
      totalReps += entry.reps ?? 0;
    }
  }
  return { totalReps, totalHoldSeconds };
}

export type ExerciseBreakdownEntry = {
  exerciseName: string;
  totalReps: number;
  /** 12 points (janvier -> décembre), 0 pour les mois sans activité. */
  monthly: { label: string; value: number }[];
};

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// Répartition par exercice (reps uniquement, isométries exclues comme pour
// aggregateAnnualTotals), triée par volume décroissant, détail mensuel prêt
// pour SimpleBarChart.
export function aggregateByExercise(entries: LogEntry[]): ExerciseBreakdownEntry[] {
  const byExercise = new Map<string, number[]>();

  for (const entry of entries) {
    if (entry.type === 'isometric' || !entry.workout_logs) continue;
    const reps = entry.reps ?? 0;
    if (reps === 0) continue;
    const monthIndex = Number(entry.workout_logs.performed_date.slice(5, 7)) - 1;
    if (!byExercise.has(entry.exercise_name)) byExercise.set(entry.exercise_name, new Array(12).fill(0));
    byExercise.get(entry.exercise_name)![monthIndex] += reps;
  }

  return Array.from(byExercise.entries())
    .map(([exerciseName, monthlyValues]) => ({
      exerciseName,
      totalReps: monthlyValues.reduce((sum, value) => sum + value, 0),
      monthly: monthlyValues.map((value, i) => ({ label: MONTH_SHORT[i], value })),
    }))
    .sort((a, b) => b.totalReps - a.totalReps);
}

// Formatage du compteur secondaire (temps de maintien cumulé) en unité
// lisible plutôt qu'un total de secondes brut.
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}min`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

// Total de reps par jour (isométries exclues) : intensité de la heatmap
// annuelle (Bloc 3). Clé = 'YYYY-MM-DD'.
export function aggregateDailyReps(entries: LogEntry[]): Map<string, number> {
  const daily = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type === 'isometric' || !entry.workout_logs) continue;
    const reps = entry.reps ?? 0;
    if (reps === 0) continue;
    const dateKey = entry.workout_logs.performed_date;
    daily.set(dateKey, (daily.get(dateKey) ?? 0) + reps);
  }
  return daily;
}
