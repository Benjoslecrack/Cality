import { aggregateWeeklyBest, aggregateWeeklySetCount } from './weeklyAggregate';

const NOW = new Date(2026, 6, 23); // jeudi 23 juillet 2026

describe('aggregateWeeklyBest', () => {
  it('garde la meilleure valeur de la semaine, pas la dernière', () => {
    const entries = [
      { type: 'reps_weight' as const, reps: 8, weight_kg: 40, hold_seconds: null, workout_logs: { performed_date: '2026-07-20' } },
      { type: 'reps_weight' as const, reps: 8, weight_kg: 55, hold_seconds: null, workout_logs: { performed_date: '2026-07-22' } },
      { type: 'reps_weight' as const, reps: 8, weight_kg: 50, hold_seconds: null, workout_logs: { performed_date: '2026-07-23' } },
    ];
    const result = aggregateWeeklyBest(entries, 3, NOW);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ value: 55, unit: 'kg' });
  });

  it('sépare les entrées par semaine et les trie chronologiquement', () => {
    const entries = [
      { type: 'isometric' as const, reps: null, weight_kg: null, hold_seconds: 12, workout_logs: { performed_date: '2026-07-13' } },
      { type: 'isometric' as const, reps: null, weight_kg: null, hold_seconds: 18, workout_logs: { performed_date: '2026-07-20' } },
    ];
    const result = aggregateWeeklyBest(entries, 3, NOW);
    expect(result.map((r) => r.value)).toEqual([12, 18]);
  });

  it("exclut les entrées antérieures à la fenêtre de N mois", () => {
    const entries = [
      { type: 'reps_weight' as const, reps: 5, weight_kg: 30, hold_seconds: null, workout_logs: { performed_date: '2026-01-01' } },
      { type: 'reps_weight' as const, reps: 8, weight_kg: 50, hold_seconds: null, workout_logs: { performed_date: '2026-07-20' } },
    ];
    const result = aggregateWeeklyBest(entries, 3, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(50);
  });

  it('ignore les entrées sans workout_logs ou sans valeur exploitable', () => {
    const entries = [
      { type: 'reps_weight' as const, reps: null, weight_kg: null, hold_seconds: null, workout_logs: { performed_date: '2026-07-20' } },
      { type: 'reps_weight' as const, reps: 8, weight_kg: 50, hold_seconds: null, workout_logs: null },
    ];
    expect(aggregateWeeklyBest(entries, 3, NOW)).toHaveLength(0);
  });
});

describe('aggregateWeeklySetCount', () => {
  it('compte le nombre de séries par semaine, tous exercices confondus', () => {
    const entries = [
      { workout_logs: { performed_date: '2026-07-20' } },
      { workout_logs: { performed_date: '2026-07-21' } },
      { workout_logs: { performed_date: '2026-07-23' } },
    ];
    const result = aggregateWeeklySetCount(entries, 3, NOW);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ value: 3, unit: 'séries' });
  });

  it('sépare correctement le volume entre deux semaines distinctes', () => {
    const entries = [
      { workout_logs: { performed_date: '2026-07-13' } },
      { workout_logs: { performed_date: '2026-07-14' } },
      { workout_logs: { performed_date: '2026-07-20' } },
    ];
    const result = aggregateWeeklySetCount(entries, 3, NOW);
    expect(result.map((r) => r.value)).toEqual([2, 1]);
  });

  it('exclut les entrées hors fenêtre et sans workout_logs', () => {
    const entries = [
      { workout_logs: { performed_date: '2026-01-01' } },
      { workout_logs: null },
      { workout_logs: { performed_date: '2026-07-20' } },
    ];
    const result = aggregateWeeklySetCount(entries, 3, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1);
  });
});
