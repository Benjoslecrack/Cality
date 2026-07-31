import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

export type ProgressLogEntry = Database['public']['Tables']['exercise_logs']['Row'] & {
  workout_logs: { performed_date: string } | null;
};

// Historique chronologique des séries loggées pour un exercice précis d'un
// programme (le suivi par skill passe désormais par useSkillLogsQuery, cf.
// useSkillRanks.ts).
export function useProgressHistoryQuery(filter: { sessionExerciseId: string }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['progress_history', 'exercise', filter.sessionExerciseId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*, workout_logs(performed_date)')
        .eq('user_id', userId!)
        .eq('session_exercise_id', filter.sessionExerciseId)
        .order('performed_date', { referencedTable: 'workout_logs', ascending: true })
        .returns<ProgressLogEntry[]>();
      if (error) throw error;
      return data;
    },
  });
}

// Toutes les séries loggées sur les N derniers mois, tous exercices/skills
// confondus : sert au volume d'entraînement hebdomadaire (Skills).
export function useAllExerciseLogsQuery(months = 3) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['progress_history', 'all', userId, months],
    enabled: !!userId,
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffKey = cutoff.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*, workout_logs!inner(performed_date)')
        .eq('user_id', userId!)
        .gte('workout_logs.performed_date', cutoffKey)
        .returns<ProgressLogEntry[]>();
      if (error) throw error;
      return data;
    },
  });
}

// Toutes les séries loggées sur une année civile complète : sert le bilan
// annuel (compteur global, répartition par exercice, heatmap). Une année de
// données perso reste de l'ordre de quelques milliers de lignes — un fetch +
// agrégation côté client (cf. src/lib/annualAggregate.ts), pas une vue
// matérialisée, cf. discussion perf.
export function useAnnualExerciseLogsQuery(year: number) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['progress_history', 'annual', userId, year],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*, workout_logs!inner(performed_date)')
        .eq('user_id', userId!)
        .gte('workout_logs.performed_date', `${year}-01-01`)
        .lte('workout_logs.performed_date', `${year}-12-31`)
        .returns<ProgressLogEntry[]>();
      if (error) throw error;
      return data;
    },
  });
}
