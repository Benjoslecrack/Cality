import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isRecordBeaten, progressPoint } from '../lib/progressValue';
import { useSkillCatalogQuery } from './useSkillRanks';
import type { Database, SkillRank } from '../types/database';

type ExerciseLogRow = Database['public']['Tables']['exercise_logs']['Row'];

export type DayLogHighlight = {
  isRecord: boolean;
  tierUnlock: { skillName: string; rank: SkillRank; subLevel: number; label: string } | null;
};

type HistoryRow = Pick<
  ExerciseLogRow,
  'id' | 'session_exercise_id' | 'exercise_name' | 'type' | 'reps' | 'weight_kg' | 'hold_seconds' | 'created_at'
>;

const HISTORY_COLUMNS = 'id, session_exercise_id, exercise_name, type, reps, weight_kg, hold_seconds, created_at';

// Historique pertinent pour rejouer "était-ce un record ?" sur des logs déjà
// en base : même règle d'identité que fetchPriorBestValue dans
// useExerciseLogs.ts (session_exercise_id si présent, sinon exercise_name).
async function fetchHistoryForLogs(userId: string, logs: ExerciseLogRow[]): Promise<HistoryRow[]> {
  const sessionExerciseIds = [...new Set(logs.filter((l) => l.session_exercise_id).map((l) => l.session_exercise_id!))];
  const freeExerciseNames = [...new Set(logs.filter((l) => !l.session_exercise_id).map((l) => l.exercise_name))];

  const results: HistoryRow[] = [];

  if (sessionExerciseIds.length > 0) {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select(HISTORY_COLUMNS)
      .eq('user_id', userId)
      .in('session_exercise_id', sessionExerciseIds);
    if (error) throw error;
    results.push(...data);
  }

  if (freeExerciseNames.length > 0) {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select(HISTORY_COLUMNS)
      .eq('user_id', userId)
      .is('session_exercise_id', null)
      .in('exercise_name', freeExerciseNames);
    if (error) throw error;
    results.push(...data);
  }

  return results;
}

async function fetchTierUnlocksForLogs(logIds: string[]) {
  const { data, error } = await supabase
    .from('user_skill_progress')
    .select('exercise_log_id, skill_id, skill_tier_id')
    .in('exercise_log_id', logIds);
  if (error) throw error;
  return data;
}

// Ni "record" ni "palier débloqué" ne sont stockés sur exercise_logs (cf.
// useAddExerciseSet / evaluateSkillRankUps : calculés au moment du log, pas
// persistés comme flag). Pour les rejouer sur un jour déjà passé (prévisu
// calendrier), on reconstruit exactement le même calcul a posteriori :
// - record : re-comparer chaque log à l'historique qui le précède (même
//   règle d'identité que fetchPriorBestValue).
// - palier débloqué : user_skill_progress.exercise_log_id pointe déjà vers
//   le log exact qui a validé le palier, donc une simple jointure suffit
//   (pas de recalcul, contrairement au record).
export function useDayHighlights(exerciseLogs: ExerciseLogRow[] | undefined) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: catalog } = useSkillCatalogQuery();
  const logIds = useMemo(() => (exerciseLogs ?? []).map((l) => l.id), [exerciseLogs]);

  const historyQuery = useQuery({
    queryKey: ['exercise_logs', 'history_for_day', userId, logIds],
    enabled: !!userId && logIds.length > 0,
    queryFn: () => fetchHistoryForLogs(userId!, exerciseLogs!),
  });

  const tierUnlocksQuery = useQuery({
    queryKey: ['user_skill_progress', 'by_exercise_logs', logIds],
    enabled: logIds.length > 0,
    queryFn: () => fetchTierUnlocksForLogs(logIds),
  });

  return useMemo(() => {
    const map = new Map<string, DayLogHighlight>();
    if (!exerciseLogs) return map;
    const history = historyQuery.data ?? [];
    const tierRows = tierUnlocksQuery.data ?? [];

    for (const log of exerciseLogs) {
      const sameExercise = (row: HistoryRow) =>
        log.session_exercise_id
          ? row.session_exercise_id === log.session_exercise_id
          : !row.session_exercise_id && row.exercise_name === log.exercise_name;

      const priorValues = history
        .filter((row) => row.id !== log.id && sameExercise(row) && row.created_at < log.created_at)
        .map((row) => progressPoint(row)?.value)
        .filter((value): value is number => value != null);
      const priorBest = priorValues.length > 0 ? Math.max(...priorValues) : null;

      const newPoint = progressPoint(log);
      const isRecord = isRecordBeaten(newPoint?.value ?? null, priorBest);

      const tierRow = tierRows.find((t) => t.exercise_log_id === log.id);
      let tierUnlock: DayLogHighlight['tierUnlock'] = null;
      if (tierRow && catalog) {
        const skill = catalog.find((s) => s.id === tierRow.skill_id);
        const tier = skill?.tiers.find((t) => t.id === tierRow.skill_tier_id);
        if (skill && tier) {
          tierUnlock = { skillName: skill.name, rank: tier.rank, subLevel: tier.subLevel, label: tier.label };
        }
      }

      map.set(log.id, { isRecord, tierUnlock });
    }

    return map;
  }, [exerciseLogs, historyQuery.data, tierUnlocksQuery.data, catalog]);
}
