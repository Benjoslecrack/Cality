import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { todayDateKey } from '../lib/dateUtils';
import type { CalendarStatus, Database } from '../types/database';

export type CalendarEntryWithSession = Database['public']['Tables']['calendar_entries']['Row'] & {
  program_sessions: {
    name: string;
    programs: { name: string } | null;
  } | null;
};

const ENTRY_SELECT = '*, program_sessions(name, programs(name))';

export function useCalendarEntriesRangeQuery(startDateKey: string, endDateKey: string) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['calendar_entries', 'range', userId, startDateKey, endDateKey],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_entries')
        .select(ENTRY_SELECT)
        .eq('user_id', userId!)
        .gte('scheduled_date', startDateKey)
        .lte('scheduled_date', endDateKey)
        .order('scheduled_date', { ascending: true })
        .returns<CalendarEntryWithSession[]>();
      if (error) throw error;
      return data;
    },
  });
}

export function useDayEntriesQuery(dateKey: string) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['calendar_entries', 'day', userId, dateKey],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_entries')
        .select(ENTRY_SELECT)
        .eq('user_id', userId!)
        .eq('scheduled_date', dateKey)
        .order('created_at', { ascending: true })
        .returns<CalendarEntryWithSession[]>();
      if (error) throw error;
      return data;
    },
  });
}

export function useTodayEntriesQuery() {
  return useDayEntriesQuery(todayDateKey());
}

export function useCreateCalendarEntry() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      programSessionId,
      scheduledDate,
    }: {
      programSessionId: string;
      scheduledDate: string;
    }) => {
      const { error } = await supabase.from('calendar_entries').insert({
        user_id: userId!,
        program_session_id: programSessionId,
        scheduled_date: scheduledDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_entries'] });
    },
  });
}

export function useUpdateCalendarEntryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CalendarStatus }) => {
      const { error } = await supabase.from('calendar_entries').update({ status }).eq('id', id);
      if (error) throw error;
    },
    // Mise à jour optimiste : "marquer fait/sauté" doit se refléter à l'écran
    // tout de suite même hors-ligne, la mutation réelle restant en attente de
    // réseau en arrière-plan.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar_entries'] });
      const previousQueries = queryClient.getQueriesData<CalendarEntryWithSession[]>({
        queryKey: ['calendar_entries'],
      });
      queryClient.setQueriesData<CalendarEntryWithSession[]>({ queryKey: ['calendar_entries'] }, (old) =>
        old?.map((entry) => (entry.id === id ? { ...entry, status } : entry))
      );
      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_entries'] });
    },
  });
}

export function useDeleteCalendarEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_entries'] });
    },
  });
}
