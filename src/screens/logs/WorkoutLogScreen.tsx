import { useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import { useExerciseLogsQuery } from '../../hooks/useExerciseLogs';
import {
  useDeleteWorkoutLog,
  usePlannedExercisesQuery,
  useUpdateWorkoutLog,
  useWorkoutLogQuery,
} from '../../hooks/useWorkoutLogs';
import { DEFAULT_REST_SECONDS } from '../../hooks/useSessionExercises';
import { formatDayLabel } from '../../lib/dateUtils';
import { COLORS } from '../../theme/tokens';
import type { ExerciseType, SkillKey } from '../../types/database';
import { ExerciseLogCard, type ExerciseCardData } from './ExerciseLogCard';

type Props = {
  route: { params: { workoutLogId: string } };
  navigation: {
    navigate: (screen: string, params?: object) => void;
    goBack: () => void;
  };
};

export function WorkoutLogScreen({ navigation, route }: Props) {
  const { workoutLogId } = route.params;
  const { data: workoutLog, isLoading: isLoadingLog } = useWorkoutLogQuery(workoutLogId);
  const { data: plannedExercises } = usePlannedExercisesQuery(workoutLog?.calendar_entry_id);
  const { data: exerciseLogs, isLoading: isLoadingLogs } = useExerciseLogsQuery(workoutLogId);
  const updateWorkoutLog = useUpdateWorkoutLog(workoutLogId);
  const deleteWorkoutLog = useDeleteWorkoutLog();

  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState<number | null>(null);

  useEffect(() => {
    if (workoutLog) {
      setNotes(workoutLog.notes ?? '');
      setRpe(workoutLog.rpe ?? null);
    }
  }, [workoutLog]);

  const cards = useMemo<ExerciseCardData[]>(() => {
    const cardList: ExerciseCardData[] = (plannedExercises ?? []).map((exercise) => ({
      key: exercise.id,
      name: exercise.name,
      type: exercise.type,
      skillKey: exercise.skill_key,
      skillId: exercise.skill_id,
      sessionExerciseId: exercise.id,
      restSeconds: exercise.target_rest_seconds ?? DEFAULT_REST_SECONDS,
      target: {
        type: exercise.type,
        target_sets: exercise.target_sets,
        target_reps: exercise.target_reps,
        target_weight_kg: exercise.target_weight_kg,
        target_hold_seconds: exercise.target_hold_seconds,
        progression_variant: exercise.progression_variant,
      },
      sets: [],
    }));

    for (const log of exerciseLogs ?? []) {
      let card = log.session_exercise_id
        ? cardList.find((c) => c.sessionExerciseId === log.session_exercise_id)
        : cardList.find((c) => c.sessionExerciseId === null && c.name === log.exercise_name);

      if (!card) {
        card = {
          key: log.session_exercise_id ?? log.exercise_name,
          name: log.exercise_name,
          type: log.type,
          skillKey: log.skill_key,
          skillId: log.skill_id,
          sessionExerciseId: log.session_exercise_id,
          restSeconds: DEFAULT_REST_SECONDS,
          sets: [],
        };
        cardList.push(card);
      }

      card.sets.push({
        id: log.id,
        set_number: log.set_number,
        reps: log.reps,
        weight_kg: log.weight_kg,
        hold_seconds: log.hold_seconds,
        progression_variant: log.progression_variant,
      });
    }

    return cardList;
  }, [plannedExercises, exerciseLogs]);

  const notesChanged =
    workoutLog && (notes !== (workoutLog.notes ?? '') || rpe !== (workoutLog.rpe ?? null));
  const hasPlan = (plannedExercises?.length ?? 0) > 0;

  const handleEditSet = (
    card: ExerciseCardData,
    setId: string,
    initialValues: ExerciseCardData['sets'][number]
  ) => {
    navigation.navigate('SetForm', {
      workoutLogId,
      sessionExerciseId: card.sessionExerciseId,
      exerciseName: card.name,
      type: card.type,
      skillKey: card.skillKey,
      skillId: card.skillId,
      setId,
      initialValues,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer cette séance loggée ?',
      'Toutes les séries enregistrées seront définitivement supprimées, y compris pour le calcul des skills.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutLog.mutateAsync(workoutLogId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (isLoadingLog || isLoadingLogs || !workoutLog) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-4">
      <Text className="font-display text-2xl text-text">{workoutLog.session_name}</Text>
      <Text className="mb-4 font-body capitalize text-textMuted">{formatDayLabel(workoutLog.performed_date)}</Text>

      {hasPlan ? (
        <Pressable
          onPress={() => navigation.navigate('GuidedSession', { workoutLogId })}
          className="mb-4 min-h-11 items-center justify-center border-2 border-accentDim py-3"
        >
          <Text className="font-bodySemibold text-sm text-text">Démarrer en mode guidé</Text>
        </Pressable>
      ) : null}

      <View className="mb-6 gap-3">
        {cards.map((card) => (
          <ExerciseLogCard
            key={card.key}
            workoutLogId={workoutLogId}
            card={card}
            onEditSet={(setId, initialValues) => handleEditSet(card, setId, initialValues)}
          />
        ))}
      </View>

      <Pressable
        onPress={() => navigation.navigate('AddLogExercise', { workoutLogId })}
        className="mb-6 min-h-11 items-center justify-center border-2 border-border bg-surface py-3.5"
      >
        <Text className="font-bodyMedium text-text">+ Ajouter un exercice</Text>
      </Pressable>

      <Stepper label="RPE de la séance (effort ressenti)" value={rpe ?? 7} onChange={setRpe} step={1} min={1} max={10} />

      <TextField
        label="Notes de séance (sensations...)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Ex. bonne séance, épaule un peu chargée..."
        multiline
        numberOfLines={3}
      />
      {notesChanged ? (
        <View className="mb-3">
          <Button
            label="Enregistrer"
            variant="secondary"
            loading={updateWorkoutLog.isPending}
            onPress={() => updateWorkoutLog.mutate({ notes: notes.trim() || null, rpe })}
          />
        </View>
      ) : null}

      <View className="mt-3">
        <Button
          label="Supprimer cette séance loggée"
          variant="secondary"
          loading={deleteWorkoutLog.isPending}
          onPress={handleDelete}
        />
      </View>
    </ScrollView>
  );
}
