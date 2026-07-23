import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { findNewlyUnlockedTiers, RANK_ORDER, type RankableLog, type SkillTierWithCriteria } from '../lib/skillRanks';
import type { SkillCriterionType, SkillRank } from '../types/database';

export type SkillTierDetail = SkillTierWithCriteria & { label: string };

export type SkillCatalogEntry = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  position: number;
  tiers: SkillTierDetail[];
};

type RawSkillRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  position: number;
  skill_tiers: {
    id: string;
    rank: SkillRank;
    label: string;
    skill_tier_criteria: { criterion_type: SkillCriterionType; threshold: number | null; variant_match: string | null }[];
  }[];
};

// Référentiel quasi statique (modifié seulement par migration) : staleTime
// long pour éviter de le re-fetcher à chaque changement d'écran.
export function useSkillCatalogQuery() {
  return useQuery({
    queryKey: ['skill_catalog'],
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<SkillCatalogEntry[]> => {
      const { data, error } = await supabase
        .from('skills')
        .select('id, key, name, description, position, skill_tiers(id, rank, label, skill_tier_criteria(criterion_type, threshold, variant_match))')
        .order('position', { ascending: true })
        .returns<RawSkillRow[]>();
      if (error) throw error;

      return data.map((skill) => ({
        id: skill.id,
        key: skill.key,
        name: skill.name,
        description: skill.description,
        position: skill.position,
        tiers: [...skill.skill_tiers]
          .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
          .map((tier) => ({
            id: tier.id,
            rank: tier.rank,
            label: tier.label,
            criteria: tier.skill_tier_criteria.map((c) => ({
              criterionType: c.criterion_type,
              threshold: c.threshold,
              variantMatch: c.variant_match,
            })),
          })),
      }));
    },
  });
}

export type SkillProgressEntry = { skillId: string; skillTierId: string; achievedAt: string };

export function useUserSkillProgressQuery() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['user_skill_progress', userId],
    enabled: !!userId,
    queryFn: async (): Promise<SkillProgressEntry[]> => {
      const { data, error } = await supabase
        .from('user_skill_progress')
        .select('skill_id, skill_tier_id, achieved_at')
        .eq('user_id', userId!);
      if (error) throw error;
      return data.map((row) => ({ skillId: row.skill_id, skillTierId: row.skill_tier_id, achievedAt: row.achieved_at }));
    },
  });
}

// Présence d'un skill_id dans le résultat = skill actif pour l'utilisateur.
export function useUserSkillSelectionQuery() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['user_skill_selection', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase.from('user_skill_selection').select('skill_id').eq('user_id', userId!);
      if (error) throw error;
      return new Set(data.map((row) => row.skill_id));
    },
  });
}

export function useToggleSkillSelection() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ skillId, active }: { skillId: string; active: boolean }) => {
      if (active) {
        const { error } = await supabase.from('user_skill_selection').insert({ user_id: userId!, skill_id: skillId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_skill_selection')
          .delete()
          .eq('user_id', userId!)
          .eq('skill_id', skillId);
        if (error) throw error;
      }
    },
    // Optimiste : le toggle doit réagir immédiatement à l'écran.
    onMutate: async ({ skillId, active }) => {
      const queryKey = ['user_skill_selection', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Set<string>>(queryKey);
      queryClient.setQueryData<Set<string>>(queryKey, (old) => {
        const next = new Set(old ?? []);
        if (active) next.add(skillId);
        else next.delete(skillId);
        return next;
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['user_skill_selection', userId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user_skill_selection', userId] });
    },
  });
}

export type SkillLogEntry = RankableLog & { id: string; createdAt: string; performedDate: string | null };

type RawSkillLogRow = {
  id: string;
  reps: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
  created_at: string;
  workout_logs: { performed_date: string } | null;
};

// Historique complet d'un skill (pour l'écran détail : liste + tendance).
export function useSkillLogsQuery(skillId: string | null) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['skill_logs', skillId, userId],
    enabled: !!userId && !!skillId,
    queryFn: async (): Promise<SkillLogEntry[]> => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('id, reps, hold_seconds, progression_variant, created_at, workout_logs(performed_date)')
        .eq('user_id', userId!)
        .eq('skill_id', skillId!)
        .order('created_at', { ascending: true })
        .returns<RawSkillLogRow[]>();
      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        reps: row.reps,
        hold_seconds: row.hold_seconds,
        progression_variant: row.progression_variant,
        createdAt: row.created_at,
        performedDate: row.workout_logs?.performed_date ?? null,
      }));
    },
  });
}

type RawTierRow = {
  id: string;
  rank: SkillRank;
  skill_tier_criteria: { criterion_type: SkillCriterionType; threshold: number | null; variant_match: string | null }[];
};

// Appelée après l'insertion d'un exercise_log tagué à un skill (cf.
// useAddExerciseSet) : recalcule sur l'historique complet du skill quels
// paliers sont désormais satisfaits et persiste ceux qui ne l'étaient pas
// encore. upsert + ignoreDuplicates protège contre une double validation en
// cas d'appels concurrents rapprochés (unique(user_id, skill_tier_id)).
export async function evaluateSkillRankUps(
  userId: string,
  skillId: string,
  newExerciseLogId: string
): Promise<SkillTierWithCriteria[]> {
  const { data: tiersData, error: tiersError } = await supabase
    .from('skill_tiers')
    .select('id, rank, skill_tier_criteria(criterion_type, threshold, variant_match)')
    .eq('skill_id', skillId)
    .returns<RawTierRow[]>();
  if (tiersError) throw tiersError;

  const tiers: SkillTierWithCriteria[] = tiersData.map((tier) => ({
    id: tier.id,
    rank: tier.rank,
    criteria: tier.skill_tier_criteria.map((c) => ({
      criterionType: c.criterion_type,
      threshold: c.threshold,
      variantMatch: c.variant_match,
    })),
  }));

  const { data: logs, error: logsError } = await supabase
    .from('exercise_logs')
    .select('reps, hold_seconds, progression_variant')
    .eq('user_id', userId)
    .eq('skill_id', skillId);
  if (logsError) throw logsError;

  const { data: unlockedRows, error: unlockedError } = await supabase
    .from('user_skill_progress')
    .select('skill_tier_id')
    .eq('user_id', userId)
    .eq('skill_id', skillId);
  if (unlockedError) throw unlockedError;
  const alreadyUnlocked = new Set(unlockedRows.map((row) => row.skill_tier_id));

  const newlyUnlocked = findNewlyUnlockedTiers(tiers, logs, alreadyUnlocked);
  if (newlyUnlocked.length === 0) return [];

  const { error: insertError } = await supabase.from('user_skill_progress').upsert(
    newlyUnlocked.map((tier) => ({
      user_id: userId,
      skill_id: skillId,
      skill_tier_id: tier.id,
      exercise_log_id: newExerciseLogId,
    })),
    { onConflict: 'user_id,skill_tier_id', ignoreDuplicates: true }
  );
  if (insertError) throw insertError;

  return newlyUnlocked;
}
