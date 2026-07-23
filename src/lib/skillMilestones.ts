import type { ExerciseType, SkillKey } from '../types/database';

export type MilestoneLogInput = {
  type: ExerciseType;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
};

export type SkillMilestone = {
  id: string;
  label: string;
  check: (logs: MilestoneLogInput[]) => boolean;
};

function maxHoldSeconds(logs: MilestoneLogInput[]): number {
  const holds = logs.filter((l) => l.type === 'isometric' && l.hold_seconds != null).map((l) => l.hold_seconds!);
  return holds.length > 0 ? Math.max(...holds) : 0;
}

function maxReps(logs: MilestoneLogInput[]): number {
  const reps = logs.filter((l) => l.reps != null).map((l) => l.reps!);
  return reps.length > 0 ? Math.max(...reps) : 0;
}

function hasVariantContaining(logs: MilestoneLogInput[], needle: string): boolean {
  return logs.some((l) => l.progression_variant?.toLowerCase().includes(needle));
}

const holdMilestones = (skillLabel: string, seconds: number[]) =>
  seconds.map((s) => ({
    id: `${skillLabel}_${s}s`,
    label: `${skillLabel} ${s}s`,
    check: (logs: MilestoneLogInput[]) => maxHoldSeconds(logs) >= s,
  }));

const repMilestones = (skillLabel: string, reps: number[]) =>
  reps.map((n) => ({
    id: `${skillLabel}_${n}reps`,
    label: `${n} ${skillLabel}${n > 1 ? 's' : ''}`,
    check: (logs: MilestoneLogInput[]) => maxReps(logs) >= n,
  }));

// Paliers clés par skill. Les holds (L-sit, front lever, HSPU) se
// définissent naturellement en temps de maintien ; muscle-up et tractions en
// nombre de répétitions. "Muscle-up strict" est un palier à part car c'est la
// variante qui compte, pas juste un nombre de reps.
export const SKILL_MILESTONES: Record<SkillKey, SkillMilestone[]> = {
  l_sit: holdMilestones('L-sit', [10, 20, 30]),
  front_lever: holdMilestones('Front lever', [5, 10, 20]),
  hspu: holdMilestones('HSPU', [10, 20, 30]),
  pull_up: repMilestones('traction', [5, 10, 15, 20]),
  muscle_up: [
    {
      id: 'muscle_up_strict',
      label: 'Muscle-up strict validé',
      check: (logs) => hasVariantContaining(logs, 'strict'),
    },
    ...repMilestones('muscle-up', [1, 3, 5]),
  ],
};
