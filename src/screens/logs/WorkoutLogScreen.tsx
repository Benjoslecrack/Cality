import { useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useExerciseLogsQuery } from '../../hooks/useExerciseLogs';
import {
  useDeleteWorkoutLog,
  usePlannedExercisesQuery,
  useUpdateWorkoutLog,
  useWorkoutLogQuery,
} from '../../hooks/useWorkoutLogs';
import { EXERCISE_TYPE_LABELS, formatExerciseTarget, formatSetValue } from '../../lib/exerciseFormat';
import { formatDayLabel } from '../../lib/dateUtils';
import { skillLabel } from '../../lib/skills';
import type { ExerciseType, SkillKey } from '../../types/database';

type ExerciseCard = {
  key: string;
  name: string;
  type: ExerciseType;
  skillKey: SkillKey | null;
  sessionExerciseId: string | null;
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

  useEffect(() => {
    if (workoutLog) setNotes(workoutLog.notes ?? '');
  }, [workoutLog]);

  const cards = useMemo<ExerciseCard[]>(() => {
    const cardList: ExerciseCard[] = (plannedExercises ?? []).map((exercise) => ({
      key: exercise.id,
      name: exercise.name,
      type: exercise.type,
      skillKey: exercise.skill_key,
      sessionExerciseId: exercise.id,
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
          sessionExerciseId: log.session_exercise_id,
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

  const notesChanged = workoutLog && notes !== (workoutLog.notes ?? '');

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
        <ActivityIndicator color="#F2545B" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-4">
      <Text className="text-2xl font-bold text-text">{workoutLog.session_name}</Text>
      <Text className="mb-4 capitalize text-textMuted">{formatDayLabel(workoutLog.performed_date)}</Text>

      <View className="mb-6 gap-3">
        {cards.map((card) => (
          <View key={card.key} className="rounded-2xl border border-border bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-text">{card.name}</Text>
              {card.skillKey ? (
                <View className="rounded-full border border-primary bg-primaryMuted px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-text">{skillLabel(card.skillKey)}</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1 text-sm text-textMuted">{EXERCISE_TYPE_LABELS[card.type]}</Text>
            {card.target ? (
              <Text className="mt-1 text-sm text-textMuted">Objectif : {formatExerciseTarget(card.target)}</Text>
            ) : null}

            {card.sets.length > 0 ? (
              <View className="mt-3 gap-1.5">
                {card.sets.map((set) => (
                  <Pressable
                    key={set.id}
                    onPress={() =>
                      navigation.navigate('SetForm', {
                        workoutLogId,
                        sessionExerciseId: card.sessionExerciseId,
                        exerciseName: card.name,
                        type: card.type,
                        skillKey: card.skillKey,
                        setId: set.id,
                        initialValues: {
                          reps: set.reps,
                          weight_kg: set.weight_kg,
                          hold_seconds: set.hold_seconds,
                          progression_variant: set.progression_variant,
                        },
                      })
                    }
                    className="flex-row items-center justify-between rounded-lg bg-surfaceAlt px-3 py-2"
                  >
                    <Text className="text-sm text-textMuted">Série {set.set_number}</Text>
                    <Text className="text-sm text-text">{formatSetValue({ ...set, type: card.type })}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={() =>
                navigation.navigate('SetForm', {
                  workoutLogId,
                  sessionExerciseId: card.sessionExerciseId,
                  exerciseName: card.name,
                  type: card.type,
                  skillKey: card.skillKey,
                })
              }
              className="mt-3 items-center rounded-lg border border-border py-2"
            >
              <Text className="text-sm font-medium text-text">+ Ajouter une série</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => navigation.navigate('AddLogExercise', { workoutLogId })}
        className="mb-6 items-center rounded-xl border border-border bg-surface py-3.5"
      >
        <Text className="font-medium text-text">+ Ajouter un exercice</Text>
      </Pressable>

      <TextField
        label="Notes de séance (RPE, sensations...)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Ex. RPE 8, bonne séance, épaule un peu chargée..."
        multiline
        numberOfLines={3}
      />
      {notesChanged ? (
        <View className="mb-3">
          <Button
            label="Enregistrer les notes"
            variant="secondary"
            loading={updateWorkoutLog.isPending}
            onPress={() => updateWorkoutLog.mutate({ notes: notes.trim() || null })}
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
