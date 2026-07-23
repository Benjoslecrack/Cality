import {
  currentRank,
  findNewlyUnlockedTiers,
  highestUnlockedTier,
  isCriterionSatisfiedByLog,
  isHigherRank,
  isTierSatisfied,
  nextLockedTier,
  rankIndex,
  tierPosition,
  tierProgress,
  type RankableLog,
  type SkillTierWithCriteria,
  type TierCriterion,
} from './skillRanks';

function log(overrides: Partial<RankableLog> = {}): RankableLog {
  return { reps: null, hold_seconds: null, progression_variant: null, ...overrides };
}

function tier(overrides: Partial<SkillTierWithCriteria> = {}): SkillTierWithCriteria {
  return { id: 't', rank: 'iron', subLevel: 1, criteria: [], ...overrides };
}

describe('rankIndex / isHigherRank', () => {
  it('ordonne les rangs de iron (le plus bas) à master (le plus haut)', () => {
    expect(rankIndex('iron')).toBe(0);
    expect(rankIndex('master')).toBe(4);
  });

  it('compare deux rangs correctement', () => {
    expect(isHigherRank('gold', 'silver')).toBe(true);
    expect(isHigherRank('silver', 'gold')).toBe(false);
    expect(isHigherRank('iron', 'iron')).toBe(false);
  });
});

describe('tierPosition', () => {
  it("va de 0 (Fer I) à 14 (Maître III) sur les 15 paliers d'un skill", () => {
    expect(tierPosition({ rank: 'iron', subLevel: 1 })).toBe(0);
    expect(tierPosition({ rank: 'iron', subLevel: 3 })).toBe(2);
    expect(tierPosition({ rank: 'bronze', subLevel: 1 })).toBe(3);
    expect(tierPosition({ rank: 'master', subLevel: 3 })).toBe(14);
  });
});

describe('isCriterionSatisfiedByLog', () => {
  it('valide un critère hold_seconds si le seuil est atteint', () => {
    const criterion: TierCriterion = { criterionType: 'hold_seconds', threshold: 10, variantMatch: null };
    expect(isCriterionSatisfiedByLog(criterion, log({ hold_seconds: 12 }))).toBe(true);
    expect(isCriterionSatisfiedByLog(criterion, log({ hold_seconds: 8 }))).toBe(false);
  });

  it('valide un critère reps si le seuil est atteint', () => {
    const criterion: TierCriterion = { criterionType: 'reps', threshold: 10, variantMatch: null };
    expect(isCriterionSatisfiedByLog(criterion, log({ reps: 10 }))).toBe(true);
    expect(isCriterionSatisfiedByLog(criterion, log({ reps: 9 }))).toBe(false);
  });

  it('applique le filtre de variante en plus du seuil numérique (désambiguïsation)', () => {
    const criterion: TierCriterion = { criterionType: 'hold_seconds', threshold: 10, variantMatch: 'tuck' };
    expect(isCriterionSatisfiedByLog(criterion, log({ hold_seconds: 12, progression_variant: 'Tuck' }))).toBe(true);
    expect(isCriterionSatisfiedByLog(criterion, log({ hold_seconds: 12, progression_variant: 'Full' }))).toBe(false);
  });

  it('un critère variant pur ne dépend que de la sous-chaîne (insensible à la casse)', () => {
    const criterion: TierCriterion = { criterionType: 'variant', threshold: null, variantMatch: 'strict' };
    expect(isCriterionSatisfiedByLog(criterion, log({ progression_variant: 'Muscle-up STRICT' }))).toBe(true);
    expect(isCriterionSatisfiedByLog(criterion, log({ progression_variant: 'kipping' }))).toBe(false);
    expect(isCriterionSatisfiedByLog(criterion, log())).toBe(false);
  });

  it('ne plante pas sur un log sans valeur exploitable', () => {
    const criterion: TierCriterion = { criterionType: 'hold_seconds', threshold: 10, variantMatch: null };
    expect(isCriterionSatisfiedByLog(criterion, log())).toBe(false);
  });
});

describe('isTierSatisfied', () => {
  it('satisfait si un seul des critères OU est validé par un seul des logs', () => {
    const t = tier({
      id: 'gold',
      rank: 'gold',
      criteria: [
        { criterionType: 'variant', threshold: null, variantMatch: 'weighted' },
        { criterionType: 'variant', threshold: null, variantMatch: 'archer' },
      ],
    });
    expect(isTierSatisfied(t, [log({ progression_variant: 'archer' })])).toBe(true);
    expect(isTierSatisfied(t, [log({ progression_variant: 'kipping' })])).toBe(false);
  });

  it('cherche à travers tout l\'historique, pas seulement le dernier log', () => {
    const t = tier({
      rank: 'silver',
      criteria: [{ criterionType: 'reps', threshold: 10, variantMatch: 'strict' }],
    });
    const logs = [log({ reps: 5, progression_variant: 'strict' }), log({ reps: 10, progression_variant: 'strict' })];
    expect(isTierSatisfied(t, logs)).toBe(true);
  });
});

describe('findNewlyUnlockedTiers', () => {
  const tiers: SkillTierWithCriteria[] = [
    tier({ id: 'iron', rank: 'iron', criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: 'tuck' }] }),
    tier({ id: 'gold', rank: 'gold', criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: 'full' }] }),
  ];

  it('renvoie les paliers désormais satisfaits qui ne sont pas déjà débloqués', () => {
    const logs = [log({ hold_seconds: 12, progression_variant: 'full' })];
    const unlocked = findNewlyUnlockedTiers(tiers, logs, new Set());
    expect(unlocked.map((t) => t.id)).toEqual(['gold']);
  });

  it('ignore un palier déjà enregistré comme débloqué', () => {
    const logs = [log({ hold_seconds: 12, progression_variant: 'full' })];
    const unlocked = findNewlyUnlockedTiers(tiers, logs, new Set(['gold']));
    expect(unlocked).toHaveLength(0);
  });

  it('peut débloquer plusieurs paliers en un seul appel (une perf dépasse plusieurs seuils)', () => {
    const logs = [
      log({ hold_seconds: 15, progression_variant: 'tuck' }),
      log({ hold_seconds: 15, progression_variant: 'full' }),
    ];
    const unlocked = findNewlyUnlockedTiers(tiers, logs, new Set());
    expect(unlocked.map((t) => t.id).sort()).toEqual(['gold', 'iron']);
  });

  it('ne débloque rien si aucun log ne satisfait aucun critère', () => {
    const logs = [log({ hold_seconds: 3, progression_variant: 'tuck' })];
    expect(findNewlyUnlockedTiers(tiers, logs, new Set())).toHaveLength(0);
  });
});

describe('currentRank', () => {
  it("renvoie null si aucun palier n'est débloqué", () => {
    expect(currentRank([])).toBeNull();
  });

  it('renvoie le plus haut rang parmi ceux débloqués', () => {
    expect(currentRank(['iron', 'bronze', 'silver'])).toBe('silver');
    expect(currentRank(['gold', 'iron'])).toBe('gold');
  });
});

// 15 paliers réalistes (3 sous-niveaux par rang macro) pour vérifier que le
// tri se fait bien sur (rang, sous-niveau) et pas seulement sur le rang.
const FULL_LADDER: SkillTierWithCriteria[] = (['iron', 'bronze', 'silver', 'gold', 'master'] as const).flatMap((rank) =>
  [1, 2, 3].map((subLevel) => tier({ id: `${rank}_${subLevel}`, rank, subLevel }))
);

describe('nextLockedTier', () => {
  it("renvoie le premier palier non débloqué dans l'ordre Fer I -> Maître III", () => {
    expect(nextLockedTier(FULL_LADDER, new Set(['iron_1', 'iron_2', 'iron_3', 'bronze_1']))?.id).toBe('bronze_2');
  });

  it('respecte le sous-niveau au sein du même rang macro (pas seulement le rang)', () => {
    // Débloqué : iron_1 et iron_3 mais pas iron_2 -> la suite logique reste iron_2.
    expect(nextLockedTier(FULL_LADDER, new Set(['iron_1', 'iron_3']))?.id).toBe('iron_2');
  });

  it("renvoie le palier Fer I si rien n'est débloqué", () => {
    expect(nextLockedTier(FULL_LADDER, new Set())?.id).toBe('iron_1');
  });

  it('renvoie null si les 15 paliers sont débloqués (Maître III atteint)', () => {
    const allIds = new Set(FULL_LADDER.map((t) => t.id));
    expect(nextLockedTier(FULL_LADDER, allIds)).toBeNull();
  });

  it("n'est pas perturbé par l'ordre des paliers en entrée (retrie en interne)", () => {
    const shuffled = [...FULL_LADDER].reverse();
    expect(nextLockedTier(shuffled, new Set(['iron_1']))?.id).toBe('iron_2');
  });
});

describe('highestUnlockedTier', () => {
  it("renvoie null si aucun palier n'est débloqué", () => {
    expect(highestUnlockedTier(FULL_LADDER, new Set())).toBeNull();
  });

  it('renvoie le palier débloqué le plus avancé (position la plus haute)', () => {
    const unlocked = new Set(['iron_1', 'iron_2', 'iron_3', 'bronze_1', 'bronze_2']);
    expect(highestUnlockedTier(FULL_LADDER, unlocked)?.id).toBe('bronze_2');
  });

  it("n'est pas trompé par un palier de rang inférieur débloqué après coup (une perf qui saute plusieurs paliers)", () => {
    // silver_1 débloqué directement (perf qui dépasse plusieurs seuils d'un coup)
    // alors que bronze_3 ne l'est pas encore : silver_1 reste le plus avancé.
    const unlocked = new Set(['iron_1', 'bronze_1', 'silver_1']);
    expect(highestUnlockedTier(FULL_LADDER, unlocked)?.id).toBe('silver_1');
  });
});

describe('tierProgress', () => {
  it('calcule le ratio pour un critère numérique simple', () => {
    const t = tier({ criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: null }] });
    expect(tierProgress(t, [log({ hold_seconds: 5 })])).toBeCloseTo(0.5);
  });

  it('plafonne à 1 même si la valeur dépasse largement le seuil', () => {
    const t = tier({ criteria: [{ criterionType: 'reps', threshold: 10, variantMatch: null }] });
    expect(tierProgress(t, [log({ reps: 50 })])).toBe(1);
  });

  it('est binaire (0 ou 1) pour un critère variant pur', () => {
    const t = tier({ rank: 'master', criteria: [{ criterionType: 'variant', threshold: null, variantMatch: 'one_arm' }] });
    expect(tierProgress(t, [log({ progression_variant: 'one_arm' })])).toBe(1);
    expect(tierProgress(t, [log({ progression_variant: 'kipping' })])).toBe(0);
  });

  it('prend le meilleur des chemins OU (le plus avancé des deux critères)', () => {
    const t = tier({
      rank: 'gold',
      criteria: [
        { criterionType: 'reps', threshold: 10, variantMatch: 'strict' },
        { criterionType: 'variant', threshold: null, variantMatch: 'one_arm' },
      ],
    });
    // 8/10 tractions strictes = 0.8, bien plus avancé que le chemin one_arm (0).
    expect(tierProgress(t, [log({ reps: 8, progression_variant: 'strict' })])).toBeCloseTo(0.8);
  });

  it('ne filtre que sur les logs correspondant à la variante requise pour le calcul du ratio', () => {
    const t = tier({ rank: 'silver', criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: 'full' }] });
    const logs = [log({ hold_seconds: 20, progression_variant: 'tuck' }), log({ hold_seconds: 3, progression_variant: 'full' })];
    // Le hold de 20s en "tuck" ne compte pas pour le seuil "full" : seul le log full (3s) compte.
    expect(tierProgress(t, logs)).toBeCloseTo(0.3);
  });
});
