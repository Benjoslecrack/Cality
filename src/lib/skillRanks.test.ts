import {
  currentRank,
  findNewlyUnlockedTiers,
  isCriterionSatisfiedByLog,
  isHigherRank,
  isTierSatisfied,
  nextLockedTier,
  rankIndex,
  tierProgress,
  type RankableLog,
  type SkillTierWithCriteria,
  type TierCriterion,
} from './skillRanks';

function log(overrides: Partial<RankableLog> = {}): RankableLog {
  return { reps: null, hold_seconds: null, progression_variant: null, ...overrides };
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
    const tier: SkillTierWithCriteria = {
      id: 'gold',
      rank: 'gold',
      criteria: [
        { criterionType: 'variant', threshold: null, variantMatch: 'weighted' },
        { criterionType: 'variant', threshold: null, variantMatch: 'archer' },
      ],
    };
    expect(isTierSatisfied(tier, [log({ progression_variant: 'archer' })])).toBe(true);
    expect(isTierSatisfied(tier, [log({ progression_variant: 'kipping' })])).toBe(false);
  });

  it('cherche à travers tout l\'historique, pas seulement le dernier log', () => {
    const tier: SkillTierWithCriteria = {
      id: 't',
      rank: 'silver',
      criteria: [{ criterionType: 'reps', threshold: 10, variantMatch: 'strict' }],
    };
    const logs = [log({ reps: 5, progression_variant: 'strict' }), log({ reps: 10, progression_variant: 'strict' })];
    expect(isTierSatisfied(tier, logs)).toBe(true);
  });
});

describe('findNewlyUnlockedTiers', () => {
  const tiers: SkillTierWithCriteria[] = [
    { id: 'iron', rank: 'iron', criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: 'tuck' }] },
    { id: 'gold', rank: 'gold', criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: 'full' }] },
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

describe('nextLockedTier', () => {
  const tiers: SkillTierWithCriteria[] = [
    { id: 'iron', rank: 'iron', criteria: [] },
    { id: 'bronze', rank: 'bronze', criteria: [] },
    { id: 'silver', rank: 'silver', criteria: [] },
    { id: 'gold', rank: 'gold', criteria: [] },
    { id: 'master', rank: 'master', criteria: [] },
  ];

  it("renvoie le premier palier non débloqué dans l'ordre Fer -> Maître", () => {
    expect(nextLockedTier(tiers, new Set(['iron', 'bronze']))?.id).toBe('silver');
  });

  it("renvoie le palier Fer si rien n'est débloqué", () => {
    expect(nextLockedTier(tiers, new Set())?.id).toBe('iron');
  });

  it('renvoie null si tous les paliers sont débloqués (Maître atteint)', () => {
    expect(nextLockedTier(tiers, new Set(['iron', 'bronze', 'silver', 'gold', 'master']))).toBeNull();
  });

  it("n'est pas perturbé par l'ordre des paliers en entrée (retrie en interne)", () => {
    const shuffled = [tiers[3], tiers[0], tiers[4], tiers[1], tiers[2]];
    expect(nextLockedTier(shuffled, new Set(['iron']))?.id).toBe('bronze');
  });
});

describe('tierProgress', () => {
  it('calcule le ratio pour un critère numérique simple', () => {
    const tier: SkillTierWithCriteria = {
      id: 't',
      rank: 'iron',
      criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: null }],
    };
    expect(tierProgress(tier, [log({ hold_seconds: 5 })])).toBeCloseTo(0.5);
  });

  it('plafonne à 1 même si la valeur dépasse largement le seuil', () => {
    const tier: SkillTierWithCriteria = {
      id: 't',
      rank: 'iron',
      criteria: [{ criterionType: 'reps', threshold: 10, variantMatch: null }],
    };
    expect(tierProgress(tier, [log({ reps: 50 })])).toBe(1);
  });

  it('est binaire (0 ou 1) pour un critère variant pur', () => {
    const tier: SkillTierWithCriteria = {
      id: 't',
      rank: 'master',
      criteria: [{ criterionType: 'variant', threshold: null, variantMatch: 'one_arm' }],
    };
    expect(tierProgress(tier, [log({ progression_variant: 'one_arm' })])).toBe(1);
    expect(tierProgress(tier, [log({ progression_variant: 'kipping' })])).toBe(0);
  });

  it('prend le meilleur des chemins OU (le plus avancé des deux critères)', () => {
    const tier: SkillTierWithCriteria = {
      id: 't',
      rank: 'gold',
      criteria: [
        { criterionType: 'reps', threshold: 10, variantMatch: 'strict' },
        { criterionType: 'variant', threshold: null, variantMatch: 'one_arm' },
      ],
    };
    // 8/10 tractions strictes = 0.8, bien plus avancé que le chemin one_arm (0).
    expect(tierProgress(tier, [log({ reps: 8, progression_variant: 'strict' })])).toBeCloseTo(0.8);
  });

  it('ne filtre que sur les logs correspondant à la variante requise pour le calcul du ratio', () => {
    const tier: SkillTierWithCriteria = {
      id: 't',
      rank: 'silver',
      criteria: [{ criterionType: 'hold_seconds', threshold: 10, variantMatch: 'full' }],
    };
    const logs = [log({ hold_seconds: 20, progression_variant: 'tuck' }), log({ hold_seconds: 3, progression_variant: 'full' })];
    // Le hold de 20s en "tuck" ne compte pas pour le seuil "full" : seul le log full (3s) compte.
    expect(tierProgress(tier, logs)).toBeCloseTo(0.3);
  });
});
