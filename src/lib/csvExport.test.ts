import { buildExerciseLogsCsv, type ExerciseLogExportRow } from './csvExport';

function row(overrides: Partial<ExerciseLogExportRow> = {}): ExerciseLogExportRow {
  return {
    exercise_name: 'Tractions',
    type: 'progression',
    skill_name: 'Tractions (skill)',
    set_number: 1,
    reps: 10,
    weight_kg: null,
    hold_seconds: null,
    progression_variant: null,
    workout_logs: { performed_date: '2026-07-20', session_name: 'Push Day', rpe: 7 },
    ...overrides,
  };
}

describe('buildExerciseLogsCsv', () => {
  it("génère l'en-tête suivi d'une ligne par série, séparés par ;", () => {
    const csv = buildExerciseLogsCsv([row()]);
    const [header, line] = csv.split('\n');
    expect(header).toBe('date;séance;exercice;skill;type;série;reps;charge_kg;maintien_s;variante;rpe');
    expect(line).toBe('2026-07-20;Push Day;Tractions;Tractions (skill);progression;1;10;;;;7');
  });

  it('produit une ligne par entrée, dans l\'ordre donné', () => {
    const csv = buildExerciseLogsCsv([
      row({ set_number: 1, reps: 8 }),
      row({ set_number: 2, reps: 9 }),
    ]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // en-tête + 2 séries
    expect(lines[1]).toContain(';1;8;');
    expect(lines[2]).toContain(';2;9;');
  });

  it('gère une série sans workout_logs (donnée orpheline) sans planter', () => {
    const csv = buildExerciseLogsCsv([row({ workout_logs: null })]);
    const line = csv.split('\n')[1];
    expect(line).toBe(';;Tractions;Tractions (skill);progression;1;10;;;;');
  });

  it('échappe les valeurs contenant le séparateur ou des guillemets', () => {
    const csv = buildExerciseLogsCsv([
      row({ progression_variant: 'kipping; strict "avancé"' }),
    ]);
    const line = csv.split('\n')[1];
    expect(line).toContain('"kipping; strict ""avancé"""');
  });

  it("n'affiche que l'en-tête pour un historique vide", () => {
    const csv = buildExerciseLogsCsv([]);
    expect(csv.split('\n')).toHaveLength(1);
  });
});
