import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CalendarEntryWithSession } from '../hooks/useCalendarEntries';
import { useSessionExercisesQuery } from '../hooks/useSessionExercises';
import { useWorkoutLogByCalendarEntryQuery } from '../hooks/useWorkoutLogs';
import { useExerciseLogsQuery } from '../hooks/useExerciseLogs';
import { useDayHighlights } from '../hooks/useDayHighlights';
import { EXERCISE_TYPE_LABELS, formatExerciseTarget, formatSetValue } from '../lib/exerciseFormat';
import { formatRankLabel, RANK_COLORS } from '../lib/rankPresentation';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import type { Database } from '../types/database';

type ExerciseLogRow = Database['public']['Tables']['exercise_logs']['Row'];

type Props = { entry: CalendarEntryWithSession };

// Prévisu en lecture seule d'une séance de calendrier : pas de sets à logger
// ici (contrairement à ExerciseLogCard), juste soit le plan (pas encore
// faite), soit ce qui a réellement été loggé (faite), soit un état "sautée".
// Réutilise les mêmes utilitaires de formatage que le logging/la vue
// programme (formatExerciseTarget, formatSetValue, EXERCISE_TYPE_LABELS) au
// lieu de dupliquer ces règles.
export function SessionPreviewCard({ entry }: Props) {
  const sessionName = entry.program_sessions?.name ?? 'Séance';
  const programName = entry.program_sessions?.programs?.name ?? null;

  if (entry.status === 'skipped') {
    return (
      <View style={CARD_SHADOW} className="border-2 border-border bg-surface p-4">
        <Header sessionName={sessionName} programName={programName} />
        <View className="mt-3 flex-row items-center gap-2">
          <Ionicons name="play-skip-forward-circle-outline" size={18} color={COLORS.textMuted} />
          <Text className="font-display text-sm uppercase text-textMuted">Séance sautée</Text>
        </View>
      </View>
    );
  }

  if (entry.status === 'done') {
    return <DonePreview entry={entry} sessionName={sessionName} programName={programName} />;
  }

  return <PlannedPreview entry={entry} sessionName={sessionName} programName={programName} />;
}

function Header({ sessionName, programName }: { sessionName: string; programName: string | null }) {
  return (
    <View>
      <Text className="font-display text-lg text-text">{sessionName}</Text>
      {programName ? <Text className="mt-0.5 font-body text-sm text-textMuted">{programName}</Text> : null}
    </View>
  );
}

function PlannedPreview({
  entry,
  sessionName,
  programName,
}: {
  entry: CalendarEntryWithSession;
  sessionName: string;
  programName: string | null;
}) {
  const { data: exercises, isLoading } = useSessionExercisesQuery(entry.program_session_id);

  return (
    <View style={CARD_SHADOW} className="border-2 border-border bg-surface p-4">
      <Header sessionName={sessionName} programName={programName} />
      <Text className="mb-2 mt-3 font-bodyMedium text-xs uppercase text-textMuted">Au programme</Text>
      {isLoading ? (
        <ActivityIndicator color={COLORS.neonCyan} />
      ) : (
        <View className="gap-2">
          {(exercises ?? []).map((exercise) => (
            <View key={exercise.id} className="border-2 border-border bg-background px-3 py-2">
              <Text className="font-bodySemibold text-sm text-text">{exercise.name}</Text>
              <Text className="font-body text-xs text-textMuted">{EXERCISE_TYPE_LABELS[exercise.type]}</Text>
              <Text className="mt-0.5 font-body text-sm text-text">{formatExerciseTarget(exercise)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function DonePreview({
  entry,
  sessionName,
  programName,
}: {
  entry: CalendarEntryWithSession;
  sessionName: string;
  programName: string | null;
}) {
  const { data: workoutLog, isLoading: loadingLog } = useWorkoutLogByCalendarEntryQuery(entry.id);
  const { data: exerciseLogs, isLoading: loadingLogs } = useExerciseLogsQuery(workoutLog?.id ?? '');
  const highlights = useDayHighlights(workoutLog ? exerciseLogs : undefined);

  const groups = useMemo(() => {
    const byIdentity = new Map<string, { name: string; sets: ExerciseLogRow[] }>();
    for (const log of exerciseLogs ?? []) {
      const key = log.session_exercise_id ?? `name:${log.exercise_name}`;
      if (!byIdentity.has(key)) byIdentity.set(key, { name: log.exercise_name, sets: [] });
      byIdentity.get(key)!.sets.push(log);
    }
    return [...byIdentity.values()];
  }, [exerciseLogs]);

  const isLoading = loadingLog || (!!workoutLog && loadingLogs);

  return (
    <View style={CARD_SHADOW} className="border-2 border-border bg-surface p-4">
      <Header sessionName={sessionName} programName={programName} />
      <Text className="mb-2 mt-3 font-bodyMedium text-xs uppercase text-textMuted">Réalisé</Text>
      {isLoading ? (
        <ActivityIndicator color={COLORS.neonCyan} />
      ) : !workoutLog || groups.length === 0 ? (
        <Text className="font-body text-sm text-textMuted">Séance marquée faite, mais aucune série loggée.</Text>
      ) : (
        <View className="gap-2">
          {groups.map((group) => (
            <View key={group.name} className="border-2 border-border bg-background px-3 py-2">
              <Text className="font-bodySemibold text-sm text-text">{group.name}</Text>
              <View className="mt-1 gap-0.5">
                {group.sets.map((set) => {
                  const highlight = highlights.get(set.id);
                  return (
                    <View key={set.id} className="flex-row items-center justify-between">
                      <Text className="font-mono text-sm text-text">{formatSetValue(set)}</Text>
                      {highlight?.isRecord ? (
                        <Text className="font-display text-xs uppercase text-accent">Record</Text>
                      ) : null}
                      {highlight?.tierUnlock ? (
                        <Text
                          className="font-display text-xs uppercase"
                          style={{ color: RANK_COLORS[highlight.tierUnlock.rank] }}
                        >
                          Palier : {formatRankLabel(highlight.tierUnlock.rank, highlight.tierUnlock.subLevel)}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
