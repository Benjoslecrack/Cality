import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, View, Pressable, ScrollView } from 'react-native';
import { Button } from '../../components/Button';
import { XPBar } from '../../components/XPBar';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import { useRestTimer } from '../../contexts/RestTimerContext';
import { useAddExerciseSet, useExerciseLogsQuery } from '../../hooks/useExerciseLogs';
import { DEFAULT_REST_SECONDS } from '../../hooks/useSessionExercises';
import { useSkillCatalogQuery } from '../../hooks/useSkillRanks';
import { usePlannedExercisesQuery, useWorkoutLogQuery } from '../../hooks/useWorkoutLogs';
import { EXERCISE_TYPE_LABELS, formatExerciseTarget } from '../../lib/exerciseFormat';
import { isDataConflictError } from '../../lib/queryClient';
import { useSuggestedSet } from '../../hooks/useSuggestedSet';
import { formatRankLabel, RANK_COLORS, RANK_LABELS } from '../../lib/rankPresentation';
import { tierPosition } from '../../lib/skillRanks';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';

type TierFlash = { color: string; label: string; isRankUp: boolean };

type Props = {
  route: { params: { workoutLogId: string } };
  navigation: { goBack: () => void };
};

export function GuidedSessionScreen({ navigation, route }: Props) {
  const { workoutLogId } = route.params;
  const { data: workoutLog, isLoading: isLoadingLog } = useWorkoutLogQuery(workoutLogId);
  const { data: plannedExercises, isLoading: isLoadingPlan } = usePlannedExercisesQuery(workoutLog?.calendar_entry_id);
  const { data: exerciseLogs, isLoading: isLoadingLogs } = useExerciseLogsQuery(workoutLogId);
  const addSet = useAddExerciseSet(workoutLogId);
  const restTimer = useRestTimer();
  const { data: catalog } = useSkillCatalogQuery();

  const steps = useMemo(() => {
    return (plannedExercises ?? []).flatMap((exercise) =>
      Array.from({ length: exercise.target_sets }, (_, i) => ({ exercise, setNumber: i + 1 }))
    );
  }, [plannedExercises]);

  const resumeIndex = useMemo(() => {
    if (!exerciseLogs) return 0;
    let index = 0;
    for (const step of steps) {
      const loggedCount = exerciseLogs.filter((log) => log.session_exercise_id === step.exercise.id).length;
      if (step.setNumber <= loggedCount) index += 1;
      else break;
    }
    return index;
  }, [steps, exerciseLogs]);

  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<'input' | 'logged'>('input');
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(20);
  const [hold, setHold] = useState(20);
  const [variant, setVariant] = useState('');
  const [wasRecord, setWasRecord] = useState(false);
  const [tierFlash, setTierFlash] = useState<TierFlash | null>(null);

  useEffect(() => {
    if (stepIndex === null && !isLoadingLogs) setStepIndex(resumeIndex);
  }, [resumeIndex, stepIndex, isLoadingLogs]);

  const step = stepIndex != null ? steps[stepIndex] : undefined;
  const isFirstSetOfExerciseThisSession =
    !!step && (exerciseLogs ?? []).filter((log) => log.session_exercise_id === step.exercise.id).length === 0;
  const { data: suggestion } = useSuggestedSet(
    step?.exercise.id ?? null,
    step?.exercise.name ?? '',
    step?.exercise.type ?? 'reps_weight'
  );

  useEffect(() => {
    if (!step) return;
    setPhase('input');
    const priorSets = (exerciseLogs ?? []).filter((log) => log.session_exercise_id === step.exercise.id);
    const lastSet = priorSets[priorSets.length - 1];
    setReps(lastSet?.reps ?? step.exercise.target_reps ?? 8);
    setWeight(lastSet?.weight_kg ?? step.exercise.target_weight_kg ?? 20);
    setHold(lastSet?.hold_seconds ?? step.exercise.target_hold_seconds ?? 20);
    setVariant(lastSet?.progression_variant ?? step.exercise.progression_variant ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Suggestion éditable pour la toute première série de l'exercice dans cette
  // séance, une fois qu'elle arrive (peut résoudre après le prérempli
  // ci-dessus, qui reste la valeur par défaut sinon) : jamais imposée.
  useEffect(() => {
    if (!step || !isFirstSetOfExerciseThisSession || !suggestion) return;
    if (step.exercise.type === 'reps_weight') {
      if (suggestion.reps != null) setReps(suggestion.reps);
      if (suggestion.weight_kg != null) setWeight(suggestion.weight_kg);
    } else if (step.exercise.type === 'isometric') {
      if (suggestion.hold_seconds != null) setHold(suggestion.hold_seconds);
    } else if (step.exercise.type === 'progression') {
      if (suggestion.reps != null) setReps(suggestion.reps);
      if (suggestion.progression_variant) setVariant(suggestion.progression_variant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion, stepIndex, isFirstSetOfExerciseThisSession]);

  if (isLoadingLog || isLoadingPlan || isLoadingLogs || stepIndex === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  if (steps.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center font-body text-textMuted">Aucun exercice planifié pour cette séance.</Text>
      </View>
    );
  }

  if (stepIndex >= steps.length) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-2 font-display text-3xl text-text">Séance terminée</Text>
        <Text className="mb-8 text-center font-body text-textMuted">
          Toutes les séries prévues ont été loggées. Bien joué.
        </Text>
        <Button label="Retour à la séance" onPress={navigation.goBack} />
      </View>
    );
  }

  const currentStep = steps[stepIndex]!;
  const { exercise } = currentStep;
  const isLastStepOfExercise =
    stepIndex === steps.length - 1 || steps[stepIndex + 1]?.exercise.id !== exercise.id;

  const handleValidate = () => {
    // Le minuteur et le passage à la série suivante ne dépendent pas du
    // réseau : la mutation elle-même peut rester en attente de reconnexion
    // sans bloquer le déroulé du mode guidé.
    restTimer.start(exercise.target_rest_seconds ?? DEFAULT_REST_SECONDS, exercise.name);
    setWasRecord(false);
    setTierFlash(null);
    setPhase('logged');

    addSet.mutate(
      {
        sessionExerciseId: exercise.id,
        exerciseName: exercise.name,
        type: exercise.type,
        skillKey: exercise.skill_key,
        skillId: exercise.skill_id,
        reps: exercise.type !== 'isometric' ? reps : null,
        weight_kg: exercise.type === 'reps_weight' ? weight : null,
        hold_seconds: exercise.type === 'isometric' ? hold : null,
        progression_variant: exercise.type === 'progression' ? variant.trim() || null : null,
      },
      {
        onSuccess: ({ isNewRecord, rankUp }) => {
          setWasRecord(isNewRecord);
          if (rankUp.newlyUnlockedTiers.length > 0) {
            const highest = rankUp.newlyUnlockedTiers.reduce((top, tier) =>
              tierPosition(tier) > tierPosition(top) ? tier : top
            );
            const isRankUp = rankUp.previousRank !== rankUp.newRank;
            setTierFlash({
              color: RANK_COLORS[highest.rank],
              label: isRankUp
                ? `Nouveau rang : ${RANK_LABELS[highest.rank]}`
                : `Nouveau palier : ${formatRankLabel(highest.rank, highest.subLevel)}`,
              isRankUp,
            });
          }
        },
        onError: (error) => {
          if (!isDataConflictError(error)) Alert.alert('Erreur', (error as Error).message);
        },
      }
    );
  };

  const handleNext = () => setStepIndex((current) => (current ?? 0) + 1);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-6">
      <Text className="mb-1 font-bodyMedium text-xs uppercase tracking-widest text-textMuted">
        {(() => {
          const distinctIds = Array.from(new Set(steps.map((s) => s.exercise.id)));
          const exerciseNumber = distinctIds.indexOf(exercise.id) + 1;
          return `Exercice ${exerciseNumber}/${distinctIds.length} · Série ${currentStep.setNumber}/${exercise.target_sets}`;
        })()}
      </Text>
      <Text className="mb-1 font-display text-3xl text-text">{exercise.name}</Text>
      {exercise.skill_id && catalog?.find((s) => s.id === exercise.skill_id) ? (
        <View className="mb-2 flex-row">
          <View className="rounded-full border border-accent bg-accentDim/40 px-2.5 py-0.5">
            <Text className="font-bodyMedium text-xs text-text">
              {catalog.find((s) => s.id === exercise.skill_id)!.name}
            </Text>
          </View>
        </View>
      ) : null}
      <Text className="mb-4 font-body text-sm text-textMuted">{EXERCISE_TYPE_LABELS[exercise.type]}</Text>
      <Text className="mb-6 font-body text-sm text-textMuted">
        Objectif : {formatExerciseTarget({
          type: exercise.type,
          target_sets: exercise.target_sets,
          target_reps: exercise.target_reps,
          target_weight_kg: exercise.target_weight_kg,
          target_hold_seconds: exercise.target_hold_seconds,
          progression_variant: exercise.progression_variant,
        })}
      </Text>

      <View style={CARD_SHADOW} className="rounded-2xl bg-surface p-5">
        {phase === 'input' ? (
          <>
            {isFirstSetOfExerciseThisSession && suggestion ? (
              <Text className="mb-3 font-bodyMedium text-xs text-textMuted">
                {suggestion.bumped
                  ? 'Suggestion : +1 par rapport à la dernière fois (RPE bas)'
                  : 'Suggestion : identique à ta dernière séance'}
              </Text>
            ) : null}
            {exercise.type === 'reps_weight' ? (
              <>
                <Stepper label="Répétitions" value={reps} onChange={setReps} step={1} min={0} max={100} />
                <Stepper label="Charge" value={weight} onChange={setWeight} step={2.5} min={0} max={400} suffix="kg" />
              </>
            ) : null}
            {exercise.type === 'isometric' ? (
              <Stepper label="Temps de maintien" value={hold} onChange={setHold} step={5} min={0} max={600} suffix="s" />
            ) : null}
            {exercise.type === 'progression' ? (
              <>
                <TextField label="Variante réalisée" value={variant} onChangeText={setVariant} placeholder="Ex. strict, kipping..." />
                <Stepper label="Répétitions (optionnel)" value={reps} onChange={setReps} step={1} min={0} max={50} />
              </>
            ) : null}
            <Pressable
              onPress={handleValidate}
              disabled={addSet.isPending}
              className={`min-h-11 items-center justify-center rounded-xl bg-accent py-4 ${addSet.isPending ? 'opacity-50' : ''}`}
            >
              <Text className="font-bodySemibold text-lg text-onAccent">Valider la série</Text>
            </Pressable>
          </>
        ) : (
          <>
            {wasRecord ? (
              <View className="mb-4">
                <Text className="mb-1.5 font-bodySemibold text-sm text-accent">Nouveau record</Text>
                <XPBar progress={1} justRecorded />
              </View>
            ) : null}
            {tierFlash ? (
              <View className="mb-4">
                <Text className="mb-1.5 font-bodySemibold text-sm" style={{ color: tierFlash.color }}>
                  {tierFlash.label}
                </Text>
                <XPBar progress={1} justRanked={tierFlash.isRankUp} fillColors={[COLORS.textMuted, tierFlash.color]} />
              </View>
            ) : null}
            {!wasRecord && !tierFlash ? <Text className="mb-4 font-body text-textMuted">Série enregistrée.</Text> : null}
            <Pressable
              onPress={handleNext}
              className="min-h-11 items-center justify-center rounded-xl bg-accent py-4"
            >
              <Text className="font-bodySemibold text-lg text-onAccent">
                {isLastStepOfExercise ? 'Exercice suivant' : 'Série suivante'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}
