import { aggregateAnnualTotals, aggregateByExercise, aggregateDailyReps, formatDuration } from './annualAggregate';

function log(overrides: Partial<Parameters<typeof aggregateAnnualTotals>[0][number]> = {}) {
  return {
    exercise_name: 'Tractions',
    type: 'reps_weight' as const,
    reps: 8,
    hold_seconds: null,
    workout_logs: { performed_date: '2026-03-15' },
    ...overrides,
  };
}

describe('aggregateAnnualTotals', () => {
  it('additionne les reps, exclut les isométries du total reps', () => {
    const result = aggregateAnnualTotals([
      log({ reps: 8 }),
      log({ reps: 10 }),
      log({ type: 'isometric', reps: null, hold_seconds: 15 }),
    ]);
    expect(result).toEqual({ totalReps: 18, totalHoldSeconds: 15 });
  });

  it('compte les logs "progression" comme des reps quand reps est renseigné', () => {
    const result = aggregateAnnualTotals([log({ type: 'progression', reps: 3 })]);
    expect(result.totalReps).toBe(3);
  });

  it('ignore les reps/hold_seconds null sans planter', () => {
    const result = aggregateAnnualTotals([log({ reps: null }), log({ type: 'isometric', hold_seconds: null })]);
    expect(result).toEqual({ totalReps: 0, totalHoldSeconds: 0 });
  });
});

describe('aggregateByExercise', () => {
  it('groupe par exercice et trie par volume décroissant', () => {
    const result = aggregateByExercise([
      log({ exercise_name: 'Pompes', reps: 20 }),
      log({ exercise_name: 'Tractions', reps: 8 }),
      log({ exercise_name: 'Tractions', reps: 6 }),
    ]);
    expect(result.map((r) => [r.exerciseName, r.totalReps])).toEqual([
      ['Pompes', 20],
      ['Tractions', 14],
    ]);
  });

  it('ventile le détail par mois (index 0 = janvier)', () => {
    const result = aggregateByExercise([
      log({ workout_logs: { performed_date: '2026-01-10' }, reps: 5 }),
      log({ workout_logs: { performed_date: '2026-03-10' }, reps: 7 }),
    ]);
    expect(result[0].monthly[0].value).toBe(5);
    expect(result[0].monthly[2].value).toBe(7);
    expect(result[0].monthly[1].value).toBe(0);
  });

  it('exclut les isométries et les entrées sans séance associée', () => {
    const result = aggregateByExercise([
      log({ type: 'isometric', reps: null, hold_seconds: 20 }),
      log({ workout_logs: null }),
    ]);
    expect(result).toEqual([]);
  });
});

describe('formatDuration', () => {
  it('affiche les secondes brutes sous la minute', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('affiche minutes sans les secondes au-delà d’une minute', () => {
    expect(formatDuration(150)).toBe('2min');
  });

  it('affiche heures + minutes au-delà d’une heure', () => {
    expect(formatDuration(3725)).toBe('1h02');
  });
});

describe('aggregateDailyReps', () => {
  it('additionne les reps du même jour toutes séances confondues', () => {
    const result = aggregateDailyReps([
      log({ workout_logs: { performed_date: '2026-05-01' }, reps: 10 }),
      log({ workout_logs: { performed_date: '2026-05-01' }, reps: 5 }),
      log({ workout_logs: { performed_date: '2026-05-02' }, reps: 8 }),
    ]);
    expect(result.get('2026-05-01')).toBe(15);
    expect(result.get('2026-05-02')).toBe(8);
    expect(result.size).toBe(2);
  });

  it("n'ajoute pas d'entrée pour un jour sans reps exploitables", () => {
    const result = aggregateDailyReps([log({ type: 'isometric', reps: null, hold_seconds: 30 })]);
    expect(result.size).toBe(0);
  });
});
