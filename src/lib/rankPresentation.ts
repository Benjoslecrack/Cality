import type { SkillRank } from '../types/database';
import { COLORS } from '../theme/tokens';

export const RANK_LABELS: Record<SkillRank, string> = {
  iron: 'Fer',
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  master: 'Maître',
};

// Déclinaison de l'accent existant plutôt que de nouvelles teintes "médaille"
// (or/argent/bronze littéraux casseraient l'univers acier/béton établi) : du
// gris neutre "pas encore accentué" (Fer) à un accent intensifié (Maître), en
// passant par accentDim déjà utilisé ailleurs dans l'app (Bronze).
export const RANK_COLORS: Record<SkillRank, string> = {
  iron: COLORS.textMuted,
  bronze: COLORS.accentDim,
  silver: '#BD471C',
  gold: COLORS.accent,
  master: '#FF7847',
};

const SUB_LEVEL_NUMERALS: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' };

// Chaque rang macro se subdivise en 3 paliers (ex. "Bronze II") : le badge de
// rang macro (couleur, flash) ne change qu'au passage I->II->III au sein du
// même rang jusqu'au saut de rang macro suivant.
export function formatRankLabel(rank: SkillRank, subLevel: number): string {
  return `${RANK_LABELS[rank]} ${SUB_LEVEL_NUMERALS[subLevel] ?? subLevel}`;
}
