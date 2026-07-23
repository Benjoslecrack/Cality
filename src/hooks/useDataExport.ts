import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { buildExerciseLogsCsv, type ExerciseLogExportRow } from '../lib/csvExport';
import { buildProgressSummaryHtml, type SkillSummary } from '../lib/pdfExport';
import { progressPoint } from '../lib/progressValue';
import { SKILL_MILESTONES, type MilestoneLogInput } from '../lib/skillMilestones';
import { SKILLS } from '../lib/skills';
import { todayDateKey } from '../lib/dateUtils';
import { aggregateWeeklyBest } from '../lib/weeklyAggregate';
import type { SkillKey } from '../types/database';

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

// Historique complet (pas de fenêtre glissante) : contrairement aux requêtes
// d'écran, un export doit remonter jusqu'à la toute première série loggée.
export function useExportLogsCsv() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*, workout_logs(performed_date, session_name, rpe)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })
        .returns<ExerciseLogExportRow[]>();
      if (error) throw error;

      const csv = buildExerciseLogsCsv(data);
      const file = asWritableFile(new File(Paths.cache, `cality-historique-${todayDateKey()}.csv`));
      if (file.exists) file.delete();
      file.create();
      file.write(csv);

      await shareFile(file.uri, 'text/csv', 'Exporter mon historique');
    },
  });
}

type SkillLogRow = MilestoneLogInput & {
  skill_key: SkillKey | null;
  workout_logs: { performed_date: string } | null;
};

// Résumé par skill suivi : même logique que l'écran Skills (record le plus
// récent, paliers débloqués, tendance 3 mois) — le PDF ne recalcule rien de
// nouveau, il réutilise exactement ces fonctions.
export function useExportProgressPdf() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*, workout_logs(performed_date)')
        .eq('user_id', userId!)
        .returns<SkillLogRow[]>();
      if (error) throw error;

      const summaries: SkillSummary[] = SKILLS.map((skill) => {
        const logs = data.filter((entry) => entry.skill_key === skill.key);
        const points = logs
          .map((entry) => progressPoint(entry))
          .filter((point): point is { value: number; unit: string } => point !== null);
        const latest = points[points.length - 1] ?? null;
        const weeklyTrend = aggregateWeeklyBest(logs, 3);
        const milestones = SKILL_MILESTONES[skill.key];

        return {
          label: skill.label,
          latest,
          weeklyTrend,
          unlockedCount: milestones.filter((m) => m.check(logs)).length,
          totalMilestones: milestones.length,
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
