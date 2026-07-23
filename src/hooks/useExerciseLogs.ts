import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
};

export function useAddExerciseSet(workoutLogId: string) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddSetInput) => {
      const { data: existingSets, error: countError } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('workout_log_id', workoutLogId)
        .eq('exercise_name', input.exerciseName);
      if (countError) throw countError;

      const { error } = await supabase.from('exercise_logs').insert({
        workout_log_id: workoutLogId,
        user_id: userId!,
        session_exercise_id: input.sessionExerciseId,
        exercise_name: input.exerciseName,
        type: input.type,
        skill_key: input.skillKey,
        set_number: existingSets.length + 1,
        reps: input.reps,
        weight_kg: input.weight_kg,
        hold_seconds: input.hold_seconds,
        progression_variant: input.progression_variant,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise_logs', workoutLogId] });
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
    },
  });
}
