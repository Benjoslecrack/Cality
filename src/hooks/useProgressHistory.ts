import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database, SkillKey } from '../types/database';

export type ProgressLogEntry = Database['public']['Tables']['exercise_logs']['Row'] & {
  workout_logs: { performed_date: string } | null;
};

type Filter = { skillKey: SkillKey } | { sessionExerciseId: string };

// Historique chronologique des séries loggées, pour un skill suivi (toutes
// variantes/exercices confondus) ou pour un exercice précis d'un programme.
export function useProgressHistoryQuery(filter: Filter) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const key = 'skillKey' in filter ? ['skill', filter.skillKey] : ['exercise', filter.sessionExerciseId];

  return useQuery({
    queryKey: ['progress_history', ...key, userId],
    enabled: !!userId,
    queryFn: async () => {
      let query = supabase
        .from('exercise_logs')
        .select('*, workout_logs(performed_date)')
        .eq('user_id', userId!);

      query = 'skillKey' in filter
        ? query.eq('skill_key', filter.skillKey)
        : query.eq('session_exercise_id', filter.sessionExerciseId);

      const { data, error } = await query
        .order('performed_date', { referencedTable: 'workout_logs', ascending: true })
        .returns<ProgressLogEntry[]>();
      if (error) throw error;
      return data;
    },
  });
}
