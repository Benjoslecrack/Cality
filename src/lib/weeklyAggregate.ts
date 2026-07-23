import { shortDateLabel, startOfWeek, toDateKey } from './dateUtils';
import { progressPoint } from './progressValue';
import type { ExerciseType } from '../types/database';

type LogEntry = {
  type: ExerciseType;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  workout_logs: { performed_date: string } | null;
};

export type WeeklyPoint = { label: string; value: number; unit: string };

// Tendance par skill sur N mois : la meilleure valeur atteinte chaque semaine
// (au-delà de la barre-signature, qui ne montre que les derniers points bruts).
export function aggregateWeeklyBest(entries: LogEntry[], months = 3): WeeklyPoint[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const buckets = new Map<string, { value: number; unit: string; weekStart: Date }>();

  for (const entry of entries) {
    if (!entry.workout_logs) continue;
    const [year, month, day] = entry.workout_logs.performed_date.split('-').map(Number);
    const performedDate = new Date(year, month - 1, day);
    if (performedDate < cutoff) continue;

    const point = progressPoint(entry);
    if (!point) continue;

    const weekStart = startOfWeek(performedDate);
    const key = toDateKey(weekStart);
    const existing = buckets.get(key);
    if (!existing || point.value > existing.value) {
      buckets.set(key, { value: point.value, unit: point.unit, weekStart });
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((bucket) => ({ label: shortDateLabel(bucket.weekStart), value: bucket.value, unit: bucket.unit }));
}

type WorkoutLogEntry = { performed_date: string };

// Volume d'entraînement par semaine, toutes séances confondues : le nombre de
// séries loggées est la seule mesure qui a du sens indépendamment du type
// d'exercice (charge, temps de maintien, reps ne se comparent pas entre eux).
export function aggregateWeeklySetCount(
  exerciseLogEntries: { workout_logs: WorkoutLogEntry | null }[],
  months = 3
): WeeklyPoint[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const buckets = new Map<string, { count: number; weekStart: Date }>();

  for (const entry of exerciseLogEntries) {
    if (!entry.workout_logs) continue;
    const [year, month, day] = entry.workout_logs.performed_date.split('-').map(Number);
    const performedDate = new Date(year, month - 1, day);
    if (performedDate < cutoff) continue;

    const weekStart = startOfWeek(performedDate);
    const key = toDateKey(weekStart);
    const existing = buckets.get(key);
    buckets.set(key, { count: (existing?.count ?? 0) + 1, weekStart });
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((bucket) => ({ label: shortDateLabel(bucket.weekStart), value: bucket.count, unit: 'séries' }));
}
