import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toDateKey } from '../lib/dateUtils';
import { isStreakActive } from '../lib/streak';

function startOfMonthKey(date: Date): string {
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

// Un log libre (calendar_entry_id null) représente une séance réellement
// faite au même titre qu'une entrée de calendrier au statut "done" — même
// règle que les points de statut du calendrier (Bloc 4).
async function fetchDoneDatesInRange(userId: string, startKey: string, endKey: string): Promise<Set<string>> {
  const [entriesResult, logsResult] = await Promise.all([
    supabase
      .from('calendar_entries')
      .select('scheduled_date')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('scheduled_date', startKey)
      .lte('scheduled_date', endKey),
    supabase
      .from('workout_logs')
      .select('performed_date')
      .eq('user_id', userId)
      .is('calendar_entry_id', null)
      .gte('performed_date', startKey)
      .lte('performed_date', endKey),
  ]);
  if (entriesResult.error) throw entriesResult.error;
  if (logsResult.error) throw logsResult.error;

  const dates = new Set<string>();
  for (const row of entriesResult.data) dates.add(row.scheduled_date);
  for (const row of logsResult.data) dates.add(row.performed_date);
  return dates;
}

// Le jour "fait" le plus récent, tous mois confondus (pour savoir si le
// streak est encore en vie, même s'il n'y a encore rien ce mois-ci — ex. le
// 1er du mois, avant toute séance, ne doit pas afficher "streak cassé" si
// la dernière semaine de calendrier compte déjà une séance).
async function fetchMostRecentDoneDate(userId: string): Promise<string | null> {
  const [entryResult, logResult] = await Promise.all([
    supabase
      .from('calendar_entries')
      .select('scheduled_date')
      .eq('user_id', userId)
      .eq('status', 'done')
      .order('scheduled_date', { ascending: false })
      .limit(1),
    supabase
      .from('workout_logs')
      .select('performed_date')
      .eq('user_id', userId)
      .is('calendar_entry_id', null)
      .order('performed_date', { ascending: false })
      .limit(1),
  ]);
  if (entryResult.error) throw entryResult.error;
  if (logResult.error) throw logResult.error;

  const candidates = [entryResult.data[0]?.scheduled_date, logResult.data[0]?.performed_date].filter(
    (d): d is string => !!d
  );
  if (candidates.length === 0) return null;
  // Clés 'YYYY-MM-DD' : tri lexical = tri chronologique.
  return candidates.sort().at(-1)!;
}

// Compteur mensuel (jours faits depuis le 1er du mois, jamais recalculé en
// arrière) + indicateur "actif/cassé" séparé, calculés à la volée depuis
// calendar_entries/workout_logs — cf. discussion : pas de table dédiée, pour
// rester cohérent avec le reste de l'app (rangs/records jamais stockés) et
// éviter qu'un compteur stocké dérive après un log rétroactif ou une
// suppression.
export function useMonthlyStreak() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const today = new Date();
  const todayKey = toDateKey(today);
  const monthStartKey = startOfMonthKey(today);

  const doneDatesQuery = useQuery({
    queryKey: ['streak', 'month_done_dates', userId, monthStartKey],
    enabled: !!userId,
    queryFn: () => fetchDoneDatesInRange(userId!, monthStartKey, todayKey),
  });

  const mostRecentQuery = useQuery({
    queryKey: ['streak', 'most_recent_done', userId],
    enabled: !!userId,
    queryFn: () => fetchMostRecentDoneDate(userId!),
  });

  const isActive = useMemo(() => {
    const mostRecent = mostRecentQuery.data;
    if (!mostRecent) return false;
    const [y, m, d] = mostRecent.split('-').map(Number);
    return isStreakActive(new Date(y, m - 1, d), today);
  }, [mostRecentQuery.data, today]);

  return {
    daysDoneThisMonth: doneDatesQuery.data?.size ?? 0,
    isActive,
    isLoading: doneDatesQuery.isLoading || mostRecentQuery.isLoading,
  };
}
