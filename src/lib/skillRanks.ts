import type { SkillCriterionType, SkillRank } from '../types/database';

// Système de rangs (v4) : logique pure de validation des paliers, découplée
// de Supabase pour rester directement testable (cf. skillRanks.test.ts).

export const RANK_ORDER: SkillRank[] = ['iron', 'bronze', 'silver', 'gold', 'master'];

export function rankIndex(rank: SkillRank): number {
  return RANK_ORDER.indexOf(rank);
}

export function isHigherRank(a: SkillRank, b: SkillRank): boolean {
  return rankIndex(a) > rankIndex(b);
}

export type RankableLog = {
  reps: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
};

export type TierCriterion = {
  criterionType: SkillCriterionType;
  threshold: number | null;
  variantMatch: string | null;
};

export type SkillTierWithCriteria = {
  id: string;
  rank: SkillRank;
  subLevel: number; // 1/2/3 (I/II/III) : chaque rang macro se subdivise en 3 paliers.
  criteria: TierCriterion[];
};

// Position globale 0-14 (rang_index*3 + (sous-niveau-1)) : ordre total sur
// les 15 paliers d'un skill, utilisé pour trier/comparer sans dépendre de
// l'ordre d'arrivée des lignes en base.
export function tierPosition(tier: Pick<SkillTierWithCriteria, 'rank' | 'subLevel'>): number {
  return rankIndex(tier.rank) * 3 + (tier.subLevel - 1);
}

function variantContains(log: RankableLog, needle: string): boolean {
  return log.progression_variant != null && log.progression_variant.toLowerCase().includes(needle.toLowerCase());
}

// variant_match sert de filtre pour hold_seconds/reps (désambiguïser deux
// paliers au même seuil, ex. front lever tuck 10s vs tuck avancé 10s), et de
// critère exclusif pour criterion_type = 'variant'.
export function isCriterionSatisfiedByLog(criterion: TierCriterion, log: RankableLog): boolean {
  const variantOk = criterion.variantMatch == null || variantContains(log, criterion.variantMatch);

  switch (criterion.criterionType) {
    case 'hold_seconds':
      return log.hold_seconds != null && criterion.threshold != null && log.hold_seconds >= criterion.threshold && variantOk;
    case 'reps':
      return log.reps != null && criterion.threshold != null && log.reps >= criterion.threshold && variantOk;
    case 'variant':
      return criterion.variantMatch != null && variantContains(log, criterion.variantMatch);
  }
}

// Un palier est satisfait si AU MOINS UN de ses critères (OU) est satisfait
// par AU MOINS UN log historique (OU) — ex. "traction lestée ou archer".
// Générique sur T (au lieu de fixé à SkillTierWithCriteria) : un appelant qui
// passe des paliers enrichis (ex. avec un `label`, cf. SkillTierDetail) les
// récupère avec ce même enrichissement en retour, sans cast.
export function isTierSatisfied<T extends SkillTierWithCriteria>(tier: T, logs: RankableLog[]): boolean {
  return tier.criteria.some((criterion) => logs.some((log) => isCriterionSatisfiedByLog(criterion, log)));
}

// Recalculé sur l'historique complet des logs du skill (pas seulement le
// nouveau log) : une première performance qui dépasse un seuil élevé peut
// valider plusieurs paliers d'un coup (15s de front lever complet valide
// aussi le seuil 10s), ce qui est le comportement souhaité.
export function findNewlyUnlockedTiers<T extends SkillTierWithCriteria>(
  tiers: T[],
  logs: RankableLog[],
  alreadyUnlockedTierIds: ReadonlySet<string>
): T[] {
  return tiers.filter((tier) => !alreadyUnlockedTierIds.has(tier.id) && isTierSatisfied(tier, logs));
}

// Rang courant = le plus haut rang parmi les paliers débloqués (dérivé,
// jamais stocké : cf. migration 0005).
export function currentRank(unlockedRanks: SkillRank[]): SkillRank | null {
  if (unlockedRanks.length === 0) return null;
  return unlockedRanks.reduce((highest, rank) => (isHigherRank(rank, highest) ? rank : highest));
}

// Premier palier non débloqué, dans l'ordre Fer I -> Maître III : la
// "prochaine étape" mise en avant sur la carte/l'écran détail. null si
// Maître III est déjà atteint.
export function nextLockedTier<T extends SkillTierWithCriteria>(
  tiers: T[],
  unlockedTierIds: ReadonlySet<string>
): T | null {
  const sorted = [...tiers].sort((a, b) => tierPosition(a) - tierPosition(b));
  return sorted.find((tier) => !unlockedTierIds.has(tier.id)) ?? null;
}

// Le palier débloqué le plus avancé (position la plus haute), pour afficher
// un badge combinant rang macro + sous-niveau (ex. "Bronze II"). null si
// aucun palier n'est encore débloqué.
export function highestUnlockedTier<T extends SkillTierWithCriteria>(
  tiers: T[],
  unlockedTierIds: ReadonlySet<string>
): T | null {
  const unlocked = tiers.filter((tier) => unlockedTierIds.has(tier.id));
  if (unlocked.length === 0) return null;
  return unlocked.reduce((top, tier) => (tierPosition(tier) > tierPosition(top) ? tier : top));
}

// Progression (0 à 1) vers un palier non encore débloqué : pour un critère
// numérique, ratio meilleure valeur historique / seuil ; pour un critère
// variant pur, 0 ou 1 (pas de mi-chemin possible). Un palier à critères
// multiples (OU) prend le chemin le plus avancé.
export function tierProgress<T extends SkillTierWithCriteria>(tier: T, logs: RankableLog[]): number {
  if (tier.criteria.length === 0) return 0;
  return Math.max(...tier.criteria.map((criterion) => criterionProgress(criterion, logs)));
}

function criterionProgress(criterion: TierCriterion, logs: RankableLog[]): number {
  if (criterion.criterionType === 'variant') {
    return logs.some((log) => isCriterionSatisfiedByLog(criterion, log)) ? 1 : 0;
  }

  const relevantLogs =
    criterion.variantMatch == null ? logs : logs.filter((log) => variantContains(log, criterion.variantMatch!));
  const field = criterion.criterionType === 'hold_seconds' ? 'hold_seconds' : 'reps';
  const best = relevantLogs.reduce((max, log) => {
    const value = log[field];
    return value != null && value > max ? value : max;
  }, 0);

  if (!criterion.threshold) return 0;
  return Math.min(best / criterion.threshold, 1);
}
