import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, View, Pressable, ScrollView } from 'react-native';
import { Button } from '../../components/Button';
import { SteelBar } from '../../components/SteelBar';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import { useRestTimer } from '../../contexts/RestTimerContext';
import { useAddExerciseSet, useExerciseLogsQuery } from '../../hooks/useExerciseLogs';
import { DEFAULT_REST_SECONDS } from '../../hooks/useSessionExercises';
import { usePlannedExercisesQuery, useWorkoutLogQuery } from '../../hooks/useWorkoutLogs';
import { EXERCISE_TYPE_LABELS, formatExerciseTarget } from '../../lib/exerciseFormat';
import { skillLabel } from '../../lib/skills';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';

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

  useEffect(() => {
    if (stepIndex === null && !isLoadingLogs) setStepIndex(resumeIndex);
  }, [resumeIndex, stepIndex, isLoadingLogs]);

  const step = stepIndex != null ? steps[stepIndex] : undefined;

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

  if (isLoadingLog || isLoadingPlan || isLoadingLogs || stepIndex === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.accent} />
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
    addSet.mutate(
      {
        sessionExerciseId: exercise.id,
        exerciseName: exercise.name,
        type: exercise.type,
        skillKey: exercise.skill_key,
        reps: exercise.type !== 'isometric' ? reps : null,
        weight_kg: exercise.type === 'reps_weight' ? weight : null,
        hold_seconds: exercise.type === 'isometric' ? hold : null,
        progression_variant: exercise.type === 'progression' ? variant.trim() || null : null,
      },
      {
        onSuccess: ({ isNewRecord }) => {
          restTimer.start(exercise.target_rest_seconds ?? DEFAULT_REST_SECONDS, exercise.name);
          setWasRecord(isNewRecord);
          setPhase('logged');
        },
        onError: (error) => Alert.alert('Erreur', (error as Error).message),
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
      {exercise.skill_key ? (
        <View className="mb-2 flex-row">
          <View className="rounded-full border border-accent bg-accentDim/40 px-2.5 py-0.5">
            <Text className="font-bodyMedium text-xs text-text">{skillLabel(exercise.skill_key)}</Text>
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
                <SteelBar progress={1} justRecorded />
              </View>
            ) : (
              <Text className="mb-4 font-body text-textMuted">Série enregistrée.</Text>
            )}
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
