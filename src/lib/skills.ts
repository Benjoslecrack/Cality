import type { SkillKey } from '../types/database';

export const SKILLS: { key: SkillKey; label: string }[] = [
  { key: 'muscle_up', label: 'Muscle-up' },
  { key: 'hspu', label: 'HSPU (handstand push-up)' },
  { key: 'l_sit', label: 'L-sit' },
  { key: 'front_lever', label: 'Front lever' },
  { key: 'pull_up', label: 'Tractions' },
];

export function skillLabel(key: SkillKey): string {
  return SKILLS.find((skill) => skill.key === key)?.label ?? key;
}
