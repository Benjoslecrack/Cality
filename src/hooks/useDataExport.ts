import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { buildExerciseLogsCsv, type ExerciseLogExportRow } from '../lib/csvExport';
import { buildProgressSummaryHtml, type SkillSummary } from '../lib/pdfExport';
import { progressPoint } from '../lib/progressValue';
import { RANK_LABELS } from '../lib/rankPresentation';
import { currentRank } from '../lib/skillRanks';
import { todayDateKey } from '../lib/dateUtils';
import { aggregateWeeklyBest } from '../lib/weeklyAggregate';
import type { ExerciseType, SkillRank } from '../types/database';

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Le partage n'est pas disponible sur cet appareil.");
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}

// Les .d.ts publiés d'expo-file-system 57 ne reportent pas les membres hérités
// de la classe interne que `File` étend au runtime (exists/create/write/delete/uri
// fonctionnent bien en pratique, seul le typage ne les expose pas) : on retype
// localement le sous-ensemble utilisé ici plutôt que de perdre la vérification
// de type sur tout le fichier.
type WritableFile = {
  exists: boolean;
  delete(): void;
  create(): void;
  write(content: string, options?: { encoding?: 'utf8' | 'base64' }): void;
  uri: string;
};
function asWritableFile(file: File): WritableFile {
  return file as unknown as WritableFile;
}

type RawExerciseLogExportRow = {
  exercise_name: string;
  type: ExerciseLogExportRow['type'];
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
  skills: { name: string } | null;
  workout_logs: { performed_date: string; session_name: string; rpe: number | null } | null;
};

// Historique complet (pas de fenêtre glissante) : contrairement aux requêtes
// d'écran, un export doit remonter jusqu'à la toute première série loggée.
export function useExportLogsCsv() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*, workout_logs(performed_date, session_name, rpe), skills(name)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })
        .returns<RawExerciseLogExportRow[]>();
      if (error) throw error;

      const rows: ExerciseLogExportRow[] = data.map((row) => ({
        exercise_name: row.exercise_name,
        type: row.type,
        skill_name: row.skills?.name ?? null,
        set_number: row.set_number,
        reps: row.reps,
        weight_kg: row.weight_kg,
        hold_seconds: row.hold_seconds,
        progression_variant: row.progression_variant,
        workout_logs: row.workout_logs,
      }));

      const csv = buildExerciseLogsCsv(rows);
      const file = asWritableFile(new File(Paths.cache, `cality-historique-${todayDateKey()}.csv`));
      if (file.exists) file.delete();
      file.create();
      file.write(csv);

      await shareFile(file.uri, 'text/csv', 'Exporter mon historique');
    },
  });
}

type RawSkillRow = { id: string; name: string; position: number; skill_tiers: { id: string; rank: SkillRank }[] };

type SkillLogRow = {
  skill_id: string | null;
  type: ExerciseType;
  reps: number | null;
  weight_kg: number | null;
  hold_seconds: number | null;
  progression_variant: string | null;
  workout_logs: { performed_date: string } | null;
};

// Résumé par skill suivi : même logique que l'écran Skills (record le plus
// récent, rang courant, tendance 3 mois) — le PDF ne recalcule rien de
// nouveau, il réutilise les mêmes données (user_skill_progress) et fonctions
// (currentRank, aggregateWeeklyBest).
export function useExportProgressPdf() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async () => {
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, position, skill_tiers(id, rank)')
        .order('position', { ascending: true })
        .returns<RawSkillRow[]>();
      if (skillsError) throw skillsError;

      // Pas de filtre "skill_id is not null" côté serveur : combiner .not()
      // avec un select imbriqué (workout_logs(...)) fait dégénérer le type
      // inféré en `never` côté supabase-js/PostgREST (limite du typage de la
      // lib, pas un choix). Sans incidence fonctionnelle : le regroupement
      // par skill ci-dessous exclut déjà naturellement les lignes sans skill.
      const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select('skill_id, type, reps, weight_kg, hold_seconds, progression_variant, workout_logs(performed_date)')
        .eq('user_id', userId!)
        .returns<SkillLogRow[]>();
      if (logsError) throw logsError;

      const { data: progress, error: progressError } = await supabase
        .from('user_skill_progress')
        .select('skill_id, skill_tier_id')
        .eq('user_id', userId!);
      if (progressError) throw progressError;

      const unlockedTierIdsBySkill = new Map<string, Set<string>>();
      for (const row of progress) {
        if (!unlockedTierIdsBySkill.has(row.skill_id)) unlockedTierIdsBySkill.set(row.skill_id, new Set());
        unlockedTierIdsBySkill.get(row.skill_id)!.add(row.skill_tier_id);
      }

      const summaries: SkillSummary[] = skills.map((skill) => {
        const skillLogs = logs.filter((entry) => entry.skill_id === skill.id);
        const points = skillLogs
          .map((entry) => progressPoint(entry))
          .filter((point): point is { value: number; unit: string } => point !== null);
        const latest = points[points.length - 1] ?? null;
        const weeklyTrend = aggregateWeeklyBest(skillLogs, 3);

        const unlockedTierIds = unlockedTierIdsBySkill.get(skill.id) ?? new Set<string>();
        const unlockedRanks = skill.skill_tiers.filter((tier) => unlockedTierIds.has(tier.id)).map((tier) => tier.rank);
        const rank = currentRank(unlockedRanks);

        return {
          label: skill.name,
          latest,
          weeklyTrend,
          rankLabel: rank ? RANK_LABELS[rank] : null,
          unlockedCount: unlockedTierIds.size,
          totalMilestones: skill.skill_tiers.length,
        };
      });

      const html = buildProgressSummaryHtml(summaries);
      // expo-print écrit le PDF dans son propre dossier de cache natif, dont
      // le chemin n'est pas reconnu par le contrôle de permission de fichier
      // d'expo-sharing (erreur "Not allowed to read file under given URL" sur
      // Android) : on réécrit le contenu dans un fichier créé via notre propre
      // Paths.cache — le même chemin déjà utilisé (et fonctionnel) pour le CSV.
      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      const file = asWritableFile(new File(Paths.cache, `cality-progression-${todayDateKey()}.pdf`));
      if (file.exists) file.delete();
      file.create();
      file.write(base64!, { encoding: 'base64' });

      await shareFile(file.uri, 'application/pdf', 'Exporter ma progression');
    },
  });
}
