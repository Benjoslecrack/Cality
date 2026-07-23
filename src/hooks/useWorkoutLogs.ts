import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type SessionExerciseRow = Database['public']['Tables']['session_exercises']['Row'];

export function useWorkoutLogQuery(workoutLogId: string | undefined) {
  return useQuery({
    queryKey: ['workout_log', workoutLogId],
    enabled: !!workoutLogId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('id', workoutLogId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// Un seul workout_log par calendar_entry : on regarde s'il en existe déjà un
// avant d'en recréer un quand l'utilisateur tape sur "Logger cette séance".
export function useWorkoutLogByCalendarEntryQuery(calendarEntryId: string) {
  return useQuery({
    queryKey: ['workout_log', 'by_calendar_entry', calendarEntryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('calendar_entry_id', calendarEntryId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// Séances planifiées : les exercices de la séance type servent de plan
// (valeurs cibles) sur lequel logger les séries réelles.
export function usePlannedExercisesQuery(calendarEntryId: string | null | undefined) {
  return useQuery({
    queryKey: ['planned_exercises', calendarEntryId],
    enabled: !!calendarEntryId,
    queryFn: async (): Promise<SessionExerciseRow[]> => {
      const { data: entry, error: entryError } = await supabase
        .from('calendar_entries')
        .select('program_session_id')
        .eq('id', calendarEntryId!)
        .single();
      if (entryError) throw entryError;

      const { data, error } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('program_session_id', entry.program_session_id)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWorkoutLog() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      sessionName: string;
      performedDate: string;
      calendarEntryId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId!,
          session_name: input.sessionName,
          performed_date: input.performedDate,
          calendar_entry_id: input.calendarEntryId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workout_logs'] });
      if (data.calendar_entry_id) {
        queryClient.invalidateQueries({ queryKey: ['workout_log', 'by_calendar_entry', data.calendar_entry_id] });
      }
    },
  });
}

export function useUpdateWorkoutLog(workoutLogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { session_name?: string; notes?: string | null }) => {
      const { error } = await supabase.from('workout_logs').update(updates).eq('id', workoutLogId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_log', workoutLogId] });
    },
  });
}

// Suppression explicite et volontaire d'un log (et donc de ses series/exercise_logs
// en cascade) : sépare "retirer du calendrier" (qui garde l'historique) de
// "supprimer mes vraies performances loggées" (qui les retire du calcul des skills).
export function useDeleteWorkoutLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workout_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_logs'] });
      queryClient.invalidateQueries({ queryKey: ['workout_log'] });
      queryClient.invalidateQueries({ queryKey: ['exercise_logs'] });
      queryClient.invalidateQueries({ queryKey: ['progress_history'] });
    },
  });
}

// Séances libres (non liées à une calendar_entry) sur une plage de dates :
// utilisé par les vues Calendrier/Aujourd'hui pour les afficher au même titre
// que les séances planifiées.
export function useFreeWorkoutLogsRangeQuery(startDateKey: string, endDateKey: string) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['workout_logs', 'free', userId, startDateKey, endDateKey],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId!)
        .is('calendar_entry_id', null)
        .gte('performed_date', startDateKey)
        .lte('performed_date', endDateKey)
        .order('performed_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useFreeWorkoutLogsByDateQuery(dateKey: string) {
  return useFreeWorkoutLogsRangeQuery(dateKey, dateKey);
}

export function useRecentWorkoutLogsQuery() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['workout_logs', 'recent', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId!)
        .order('performed_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}
