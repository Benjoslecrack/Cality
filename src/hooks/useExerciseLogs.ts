import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isRecordBeaten, progressPoint } from '../lib/progressValue';
import { evaluateSkillRankUps } from './useSkillRanks';
import type { SkillTierWithCriteria } from '../lib/skillRanks';
import type { ExerciseType, SkillKey } from '../types/database';

export function useExerciseLogsQuery(workoutLogId: string) {
  return useQuery({
    queryKey: ['exercise_logs', workoutLogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('workout_log_id', workoutLogId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export type AddSetInput = {
  sessionExerciseId: string | null;
  exerciseName: string;
  type: ExerciseType;
  skillKey: SkillKey | null;
  skillId: string | null;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
};

// Historique de référence pour la détection de record : même périmètre que
// "Voir l'historique" (session_exercise_id si l'exercice est planifié, sinon
// le nom pour les ajouts à la volée) — un variant différent d'un même skill
// (ex. muscle-up kipping vs strict) n'est pas comparé au même record.
async function fetchPriorBestValue(
  userId: string,
  type: ExerciseType,
  sessionExerciseId: string | null,
  exerciseName: string
): Promise<number | null> {
  let query = supabase.from('exercise_logs').select('reps, weight_kg, hold_seconds').eq('user_id', userId);
  query = sessionExerciseId
    ? query.eq('session_exercise_id', sessionExerciseId)
    : query.eq('exercise_name', exerciseName);

  const { data, error } = await query;
  if (error) throw error;

  const values = data
    .map((row) => progressPoint({ type, reps: row.reps, weight_kg: row.weight_kg, hold_seconds: row.hold_seconds }))
    .filter((point): point is { value: number; unit: string } => point !== null)
    .map((point) => point.value);

  return values.length > 0 ? Math.max(...values) : null;
}

export function useAddExerciseSet(workoutLogId: string) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddSetInput) => {
      const priorBest = await fetchPriorBestValue(userId!, input.type, input.sessionExerciseId, input.exerciseName);

      const { data: existingSets, error: countError } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('workout_log_id', workoutLogId)
        .eq('exercise_name', input.exerciseName);
      if (countError) throw countError;

      const { data: row, error } = await supabase
        .from('exercise_logs')
        .insert({
          workout_log_id: workoutLogId,
          user_id: userId!,
          session_exercise_id: input.sessionExerciseId,
          exercise_name: input.exerciseName,
          type: input.type,
          skill_key: input.skillKey,
          skill_id: input.skillId,
          set_number: existingSets.length + 1,
          reps: input.reps,
          weight_kg: input.weight_kg,
          hold_seconds: input.hold_seconds,
          progression_variant: input.progression_variant,
        })
        .select()
        .single();
      if (error) throw error;

      const newPoint = progressPoint({
        type: input.type,
        reps: input.reps,
        weight_kg: input.weight_kg,
        hold_seconds: input.hold_seconds,
      });
      const isNewRecord = isRecordBeaten(newPoint?.value ?? null, priorBest);

      let newlyUnlockedTiers: SkillTierWithCriteria[] = [];
      if (input.skillId) {
        newlyUnlockedTiers = await evaluateSkillRankUps(userId!, input.skillId, row.id);
      }

      return { row, isNewRecord, newlyUnlockedTiers };
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['exercise_logs', workoutLogId] });
      queryClient.invalidateQueries({ queryKey: ['progress_history'] });
      if (input.skillId) {
        queryClient.invalidateQueries({ queryKey: ['user_skill_progress', userId] });
        queryClient.invalidateQueries({ queryKey: ['skill_logs', input.skillId, userId] });
      }
    },
  });
}

export function useUpdateExerciseSet(workoutLogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      reps?: number | null;
      weight_kg?: number | null;
      hold_seconds?: number | null;
      progression_variant?: string | null;
    }) => {
      const { error } = await supabase.from('exercise_logs').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise_logs', workoutLogId] });
      queryClient.invalidateQueries({ queryKey: ['progress_history'] });
    },
  });
}

export function useDeleteExerciseSet(workoutLogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise_logs', workoutLogId] });
      queryClient.invalidateQueries({ queryKey: ['progress_history'] });
    },
  });
}
