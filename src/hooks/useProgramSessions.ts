import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

export type ProgramSessionWithExerciseCount = Database['public']['Tables']['program_sessions']['Row'] & {
  session_exercises: { count: number }[];
};

export function useProgramSessionsQuery(programId: string | undefined) {
  return useQuery({
    queryKey: ['program_sessions', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_sessions')
        .select('*, session_exercises(count)')
        .eq('program_id', programId!)
        .order('position', { ascending: true })
        .returns<ProgramSessionWithExerciseCount[]>();
      if (error) throw error;
      return data;
    },
  });
}

export function useProgramSessionQuery(programSessionId: string | undefined) {
  return useQuery({
    queryKey: ['program_session', programSessionId],
    enabled: !!programSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('id', programSessionId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProgramSession(programId: string) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: existing, error: countError } = await supabase
        .from('program_sessions')
        .select('id')
        .eq('program_id', programId);
      if (countError) throw countError;

      const { data, error } = await supabase
        .from('program_sessions')
        .insert({
          program_id: programId,
          user_id: userId!,
          name,
          position: existing.length,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program_sessions', programId] });
    },
  });
}

export function useUpdateProgramSession(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('program_sessions').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['program_sessions', programId] });
      queryClient.invalidateQueries({ queryKey: ['program_session', variables.id] });
    },
  });
}

export function useDeleteProgramSession(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('program_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program_sessions', programId] });
    },
  });
}
