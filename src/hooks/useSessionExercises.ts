import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ExerciseType, SkillKey } from '../types/database';

export type SessionExerciseInput = {
  name: string;
  type: ExerciseType;
  skill_key: SkillKey | null;
  target_sets: number;
  target_reps: number | null;
  target_weight_kg: number | null;
  target_hold_seconds: number | null;
  target_rest_seconds: number | null;
  progression_variant: string | null;
  notes: string | null;
};

export const DEFAULT_REST_SECONDS = 90;

export function useSessionExercisesQuery(programSessionId: string | undefined) {
  return useQuery({
    queryKey: ['session_exercises', programSessionId],
    enabled: !!programSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('program_session_id', programSessionId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSessionExercise(programSessionId: string) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SessionExerciseInput) => {
      const { data: existing, error: countError } = await supabase
        .from('session_exercises')
        .select('id')
        .eq('program_session_id', programSessionId);
      if (countError) throw countError;

      const { data, error } = await supabase
        .from('session_exercises')
        .insert({
          program_session_id: programSessionId,
          user_id: userId!,
          position: existing.length,
          ...input,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session_exercises', programSessionId] });
      queryClient.invalidateQueries({ queryKey: ['program_sessions'] });
    },
  });
}

export function useUpdateSessionExercise(programSessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<SessionExerciseInput>) => {
      const { error } = await supabase.from('session_exercises').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session_exercises', programSessionId] });
    },
  });
}

export function useDeleteSessionExercise(programSessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('session_exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session_exercises', programSessionId] });
      queryClient.invalidateQueries({ queryKey: ['program_sessions'] });
    },
  });
}
