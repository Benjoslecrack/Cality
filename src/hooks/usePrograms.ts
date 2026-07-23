import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

// Le générateur de types de supabase-js ne peut pas déduire la forme d'une
// ressource imbriquée (program_sessions(count)) à partir de notre schéma écrit
// à la main : on le précise explicitement via `.returns<T>()`.
export type ProgramWithSessionCount = Database['public']['Tables']['programs']['Row'] & {
  program_sessions: { count: number }[];
};

export function useProgramsQuery() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['programs', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*, program_sessions(count)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .returns<ProgramWithSessionCount[]>();
      if (error) throw error;
      return data;
    },
  });
}

export function useProgramQuery(programId: string | undefined) {
  return useQuery({
    queryKey: ['program', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProgram() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null }) => {
      const { data, error } = await supabase
        .from('programs')
        .insert({ user_id: userId!, name: input.name, description: input.description ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', userId] });
    },
  });
}

export function useUpdateProgram() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string | null;
    }) => {
      const { error } = await supabase.from('programs').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs', userId] });
      queryClient.invalidateQueries({ queryKey: ['program', variables.id] });
    },
  });
}

export function useDeleteProgram() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', userId] });
    },
  });
}

// Duplique un programme complet (séances + exercices) en une nouvelle copie.
// Fait côté client en plusieurs requêtes : plus simple à lire/maintenir qu'une
// fonction SQL dédiée, largement suffisant vu le volume de données par programme.
export function useDuplicateProgram() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      const { data: original, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single();
      if (programError) throw programError;

      const { data: newProgram, error: createProgramError } = await supabase
        .from('programs')
        .insert({
          user_id: userId!,
          name: `${original.name} (copie)`,
          description: original.description,
        })
        .select()
        .single();
      if (createProgramError) throw createProgramError;

      const { data: sessions, error: sessionsError } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('program_id', programId)
        .order('position', { ascending: true });
      if (sessionsError) throw sessionsError;

      for (const originalSession of sessions) {
        const { data: newSession, error: createSessionError } = await supabase
          .from('program_sessions')
          .insert({
            program_id: newProgram.id,
            user_id: userId!,
            name: originalSession.name,
            position: originalSession.position,
          })
          .select()
          .single();
        if (createSessionError) throw createSessionError;

        const { data: exercises, error: exercisesError } = await supabase
          .from('session_exercises')
          .select('*')
          .eq('program_session_id', originalSession.id)
          .order('position', { ascending: true });
        if (exercisesError) throw exercisesError;

        if (exercises.length > 0) {
          const { error: insertExercisesError } = await supabase.from('session_exercises').insert(
            exercises.map((exercise) => ({
              program_session_id: newSession.id,
              user_id: userId!,
              name: exercise.name,
              type: exercise.type,
              skill_key: exercise.skill_key,
              skill_id: exercise.skill_id,
              position: exercise.position,
              target_sets: exercise.target_sets,
              target_reps: exercise.target_reps,
              target_weight_kg: exercise.target_weight_kg,
              target_hold_seconds: exercise.target_hold_seconds,
              progression_variant: exercise.progression_variant,
              notes: exercise.notes,
            }))
          );
          if (insertExercisesError) throw insertExercisesError;
        }
      }

      return newProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', userId] });
    },
  });
}
