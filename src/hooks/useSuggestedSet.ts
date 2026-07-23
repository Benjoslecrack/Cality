import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { computeSuggestion, type SetSuggestion } from '../lib/suggestSet';
import type { ExerciseType } from '../types/database';

export type { SetSuggestion } from '../lib/suggestSet';

// Suggestion éditable pour la première série d'un exercice dans une nouvelle
// séance : reprend la dernière performance loggée, et pousse légèrement
// (+1 rep ou +5s) si cette dernière séance a été faite à RPE bas — jamais
// appliqué automatiquement, seulement pré-rempli dans les steppers.
export function useSuggestedSet(
  sessionExerciseId: string | null,
  exerciseName: string,
  type: ExerciseType
) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['suggested_set', sessionExerciseId ?? exerciseName, userId],
    enabled: !!userId,
    queryFn: async (): Promise<SetSuggestion | null> => {
      let query = supabase
        .from('exercise_logs')
        .select('reps, weight_kg, hold_seconds, progression_variant, workout_logs(rpe)')
        .eq('user_id', userId!);
      query = sessionExerciseId
        ? query.eq('session_exercise_id', sessionExerciseId)
        : query.eq('exercise_name', exerciseName);

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
      if (error) throw error;

      const last = data[0] as
        | { reps: number | null; weight_kg: number | null; hold_seconds: number | null; progression_variant: string | null; workout_logs: { rpe: number | null } | null }
        | undefined;
      if (!last) return null;

      const rpe = last.workout_logs?.rpe ?? null;
      return computeSuggestion(last, rpe, type);
    },
  });
}
