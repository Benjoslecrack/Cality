import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type ProgramWithSessions = {
  id: string;
  name: string;
  program_sessions: { id: string; name: string }[];
};

// Utilisé par le sélecteur de séance (assignation au calendrier) : liste les
// programmes de l'utilisateur avec leurs séances types, pour choisir laquelle
// planifier à une date donnée.
export function useProgramsWithSessionsQuery() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['programs_with_sessions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, program_sessions(id, name)')
        .eq('user_id', userId!)
        .order('name', { ascending: true })
        .returns<ProgramWithSessions[]>();
      if (error) throw error;
      return data;
    },
  });
}
