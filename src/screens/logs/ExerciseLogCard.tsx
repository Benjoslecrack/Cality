import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { XPBar } from '../../components/XPBar';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import { useRestTimer } from '../../contexts/RestTimerContext';
import { useAddExerciseSet } from '../../hooks/useExerciseLogs';
import { useSkillCatalogQuery } from '../../hooks/useSkillRanks';
import { useSuggestedSet } from '../../hooks/useSuggestedSet';
import { isDataConflictError } from '../../lib/queryClient';
import { EXERCISE_TYPE_LABELS, formatExerciseTarget, formatSetValue } from '../../lib/exerciseFormat';
import { formatRankLabel, RANK_COLORS, RANK_LABELS } from '../../lib/rankPresentation';
import { tierPosition } from '../../lib/skillRanks';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';
import type { ExerciseType, SkillKey } from '../../types/database';

type TierFlash = { color: string; label: string; isRankUp: boolean };

export type ExerciseCardData = {
  key: string;
  name: string;
  type: ExerciseType;
  skillKey: SkillKey | null;
  skillId: string | null;
  sessionExerciseId: string | null;
  restSeconds: number;
  target?: {
    type: ExerciseType;
    target_sets: number;
    target_reps: number | null;
    target_weight_kg: number | null;
    target_hold_seconds: number | null;
    progression_variant: string | null;
  };
  sets: {
    id: string;
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    hold_seconds: number | null;
    progression_variant: string | null;
  }[];
};

type Props = {
  workoutLogId: string;
  card: ExerciseCardData;
  onEditSet: (setId: string, initialValues: ExerciseCardData['sets'][number]) => void;
};

export function ExerciseLogCard({ workoutLogId, card, onEditSet }: Props) {
  const addSet = useAddExerciseSet(workoutLogId);
  const restTimer = useRestTimer();
  const lastSet = card.sets[card.sets.length - 1];
  const isFirstSetOfSession = card.sets.length === 0;
  const { data: suggestion } = useSuggestedSet(card.sessionExerciseId, card.name, card.type);
  const { data: catalog } = useSkillCatalogQuery();
  const skillName = card.skillId ? catalog?.find((s) => s.id === card.skillId)?.name : null;

  const [reps, setReps] = useState(lastSet?.reps ?? card.target?.target_reps ?? 8);
  const [weight, setWeight] = useState(lastSet?.weight_kg ?? card.target?.target_weight_kg ?? 20);
  const [hold, setHold] = useState(lastSet?.hold_seconds ?? card.target?.target_hold_seconds ?? 20);
  const [variant, setVariant] = useState(lastSet?.progression_variant ?? card.target?.progression_variant ?? '');
  const [showRecordFlash, setShowRecordFlash] = useState(false);
  const [tierFlash, setTierFlash] = useState<TierFlash | null>(null);

  // Suggestion éditable pour la toute première série de l'exercice dans cette
  // séance (au-delà, on reprend simplement la série précédente de la séance
  // en cours, prioritaire) : jamais appliquée automatiquement, juste préremplie.
  useEffect(() => {
    if (!isFirstSetOfSession || !suggestion) return;
    if (card.type === 'reps_weight') {
      if (suggestion.reps != null) setReps(suggestion.reps);
      if (suggestion.weight_kg != null) setWeight(suggestion.weight_kg);
    } else if (card.type === 'isometric') {
      if (suggestion.hold_seconds != null) setHold(suggestion.hold_seconds);
    } else if (card.type === 'progression') {
      if (suggestion.reps != null) setReps(suggestion.reps);
      if (suggestion.progression_variant) setVariant(suggestion.progression_variant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion, isFirstSetOfSession]);

  const handleValidate = () => {
    // Démarré tout de suite, pas dans onSuccess : ne dépend pas du réseau, la
    // mutation elle-même peut rester en attente de reconnexion.
    restTimer.start(card.restSeconds, card.name);

    addSet.mutate(
      {
        sessionExerciseId: card.sessionExerciseId,
        exerciseName: card.name,
        type: card.type,
        skillKey: card.skillKey,
        skillId: card.skillId,
        reps: card.type !== 'isometric' ? reps : null,
        weight_kg: card.type === 'reps_weight' ? weight : null,
        hold_seconds: card.type === 'isometric' ? hold : null,
        progression_variant: card.type === 'progression' ? variant.trim() || null : null,
      },
      {
        onSuccess: ({ isNewRecord, rankUp }) => {
          if (isNewRecord) {
            setShowRecordFlash(true);
            setTimeout(() => setShowRecordFlash(false), 2600);
          }
          if (rankUp.newlyUnlockedTiers.length > 0) {
            const highest = rankUp.newlyUnlockedTiers.reduce((top, tier) =>
              tierPosition(tier) > tierPosition(top) ? tier : top
            );
            // Nouveau rang macro (ex. Fer III -> Bronze I) : badge + flash
            // distinct. Simple palier (I->II->III au sein du même rang) : la
            // barre avance, sans l'habillage "rang" pour ne pas le confondre
            // avec un vrai changement de catégorie.
            const isRankUp = rankUp.previousRank !== rankUp.newRank;
            setTierFlash({
              color: RANK_COLORS[highest.rank],
              label: isRankUp
                ? `Nouveau rang : ${RANK_LABELS[highest.rank]}`
                : `Nouveau palier : ${formatRankLabel(highest.rank, highest.subLevel)}`,
              isRankUp,
            });
            setTimeout(() => setTierFlash(null), 2600);
          }
        },
        onError: (error) => {
          if (!isDataConflictError(error)) Alert.alert('Erreur', (error as Error).message);
        },
      }
    );
  };

  return (
    <View style={CARD_SHADOW} className="rounded-2xl bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-bodySemibold text-base text-text">{card.name}</Text>
        {skillName ? (
          <View className="rounded-full border border-accent bg-accentDim/40 px-2.5 py-0.5">
            <Text className="font-bodyMedium text-xs text-text">{skillName}</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-1 font-body text-sm text-textMuted">{EXERCISE_TYPE_LABELS[card.type]}</Text>
      {card.target ? (
        <Text className="mt-1 font-body text-sm text-textMuted">Objectif : {formatExerciseTarget(card.target)}</Text>
      ) : null}

      {card.sets.length > 0 ? (
        <View className="mt-3 gap-1.5">
          {card.sets.map((set) => (
            <Pressable
              key={set.id}
              onPress={() => onEditSet(set.id, set)}
              className="min-h-11 flex-row items-center justify-between rounded-lg bg-background px-3"
            >
              <Text className="font-body text-sm text-textMuted">Série {set.set_number}</Text>
              <Text className="font-mono text-sm text-text">{formatSetValue({ ...set, type: card.type })}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="mt-4">
        {isFirstSetOfSession && suggestion ? (
          <Text className="mb-2 font-bodyMedium text-xs text-textMuted">
            {suggestion.bumped
              ? 'Suggestion : +1 par rapport à la dernière fois (RPE bas)'
              : 'Suggestion : identique à ta dernière séance'}
          </Text>
        ) : null}
        {card.type === 'reps_weight' ? (
          <>
            <Stepper label="Répétitions" value={reps} onChange={setReps} step={1} min={0} max={100} />
            <Stepper label="Charge" value={weight} onChange={setWeight} step={2.5} min={0} max={400} suffix="kg" />
          </>
        ) : null}
        {card.type === 'isometric' ? (
          <Stepper label="Temps de maintien" value={hold} onChange={setHold} step={5} min={0} max={600} suffix="s" />
        ) : null}
        {card.type === 'progression' ? (
          <>
            <TextField label="Variante réalisée" value={variant} onChangeText={setVariant} placeholder="Ex. strict, kipping..." />
            <Stepper label="Répétitions (optionnel)" value={reps} onChange={setReps} step={1} min={0} max={50} />
          </>
        ) : null}

        <Pressable
          onPress={handleValidate}
          disabled={addSet.isPending}
          className={`min-h-11 items-center justify-center rounded-xl bg-accent py-3 ${addSet.isPending ? 'opacity-50' : ''}`}
        >
          <Text className="font-bodySemibold text-base text-onAccent">Valider la série</Text>
        </Pressable>
      </View>

      {showRecordFlash ? (
        <View className="mt-3">
          <Text className="mb-1.5 font-bodySemibold text-sm text-accent">Nouveau record</Text>
          <XPBar progress={1} justRecorded />
        </View>
      ) : null}

      {tierFlash ? (
        <View className="mt-3">
          <Text className="mb-1.5 font-bodySemibold text-sm" style={{ color: tierFlash.color }}>
            {tierFlash.label}
          </Text>
          <XPBar progress={1} justRanked={tierFlash.isRankUp} fillColors={[COLORS.textMuted, tierFlash.color]} />
        </View>
      ) : null}
    </View>
  );
}
