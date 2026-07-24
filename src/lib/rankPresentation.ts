import type { SkillRank } from '../types/database';
import { COLORS } from '../theme/tokens';

export const RANK_LABELS: Record<SkillRank, string> = {
  iron: 'Fer',
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  master: 'Maître',
};

// Palette de médailles pixel art : du plus terne (Fer) au plus éclatant
// (Maître, en néon magenta plein — animé dans RankBadge). Bronze/Argent/Or
// dérivent des teintes chaudes/froides de la palette synthwave plutôt que de
// couleurs "médaille" littérales, pour rester cohérents avec le reste de l'app.
export const RANK_COLORS: Record<SkillRank, string> = {
  iron: COLORS.textMuted,
  bronze: '#C9793F',
  silver: '#7DD3E0',
  gold: '#FFB627',
  master: COLORS.neonMagenta,
};

const SUB_LEVEL_NUMERALS: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' };

// Chaque rang macro se subdivise en 3 paliers (ex. "Bronze II") : le badge de
// rang macro (couleur, flash) ne change qu'au passage I->II->III au sein du
// même rang jusqu'au saut de rang macro suivant.
export function formatRankLabel(rank: SkillRank, subLevel: number): string {
  return `${RANK_LABELS[rank]} ${SUB_LEVEL_NUMERALS[subLevel] ?? subLevel}`;
}
