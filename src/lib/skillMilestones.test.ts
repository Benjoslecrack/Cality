import { SKILL_MILESTONES, type MilestoneLogInput } from './skillMilestones';

function holdLog(hold_seconds: number): MilestoneLogInput {
  return { type: 'isometric', reps: null, weight_kg: null, hold_seconds, progression_variant: null };
}

function repLog(reps: number, progression_variant: string | null = null): MilestoneLogInput {
  return { type: 'progression', reps, weight_kg: null, hold_seconds: null, progression_variant };
}

describe('SKILL_MILESTONES - paliers de maintien (l_sit, front_lever, hspu)', () => {
  it('valide un palier de L-sit atteint (10s)', () => {
    const milestone = SKILL_MILESTONES.l_sit.find((m) => m.id === 'L-sit_10s')!;
    expect(milestone.check([holdLog(12)])).toBe(true);
  });

  it('ne valide pas un palier de L-sit non atteint', () => {
    const milestone = SKILL_MILESTONES.l_sit.find((m) => m.id === 'L-sit_20s')!;
    expect(milestone.check([holdLog(12)])).toBe(false);
  });

  it('prend le meilleur temps de maintien parmi plusieurs logs', () => {
    const milestone = SKILL_MILESTONES.front_lever.find((m) => m.id === 'Front lever_10s')!;
    expect(milestone.check([holdLog(3), holdLog(11), holdLog(7)])).toBe(true);
  });

  it('ignore les logs qui ne sont pas de type isométrique', () => {
    const milestone = SKILL_MILESTONES.hspu.find((m) => m.id === 'HSPU_10s')!;
    expect(milestone.check([repLog(15)])).toBe(false);
  });

  it('renvoie false sur une liste de logs vide', () => {
    const milestone = SKILL_MILESTONES.hspu.find((m) => m.id === 'HSPU_10s')!;
    expect(milestone.check([])).toBe(false);
  });
});

describe('SKILL_MILESTONES - paliers de répétitions (pull_up, muscle_up)', () => {
  it('valide un palier de tractions atteint', () => {
    const milestone = SKILL_MILESTONES.pull_up.find((m) => m.id === 'traction_5reps')!;
    expect(milestone.check([repLog(6)])).toBe(true);
  });

  it('ne valide pas un palier de tractions non atteint', () => {
    const milestone = SKILL_MILESTONES.pull_up.find((m) => m.id === 'traction_10reps')!;
    expect(milestone.check([repLog(6)])).toBe(false);
  });

  it('valide le premier muscle-up (1 rep)', () => {
    const milestone = SKILL_MILESTONES.muscle_up.find((m) => m.id === 'muscle-up_1reps')!;
    expect(milestone.check([repLog(1)])).toBe(true);
  });
});

describe('SKILL_MILESTONES - muscle-up strict', () => {
  it('valide le badge strict si un log contient la variante "strict"', () => {
    const milestone = SKILL_MILESTONES.muscle_up.find((m) => m.id === 'muscle_up_strict')!;
    expect(milestone.check([repLog(1, 'Strict')])).toBe(true);
  });

  it('ignore la casse pour la détection de la variante', () => {
    const milestone = SKILL_MILESTONES.muscle_up.find((m) => m.id === 'muscle_up_strict')!;
    expect(milestone.check([repLog(1, 'MUSCLE-UP STRICT')])).toBe(true);
  });

  it('ne valide pas le badge strict pour une variante kipping', () => {
    const milestone = SKILL_MILESTONES.muscle_up.find((m) => m.id === 'muscle_up_strict')!;
    expect(milestone.check([repLog(3, 'kipping')])).toBe(false);
  });

  it('ne valide pas le badge strict sans variante renseignée', () => {
    const milestone = SKILL_MILESTONES.muscle_up.find((m) => m.id === 'muscle_up_strict')!;
    expect(milestone.check([repLog(3, null)])).toBe(false);
  });
});
