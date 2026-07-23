import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { CalendarEntryCard } from '../components/CalendarEntryCard';
import { FreeWorkoutLogCard } from '../components/FreeWorkoutLogCard';
import { SteelBar } from '../components/SteelBar';
import { useTodayEntriesQuery } from '../hooks/useCalendarEntries';
import { useCreateWorkoutLog, useFreeWorkoutLogsByDateQuery } from '../hooks/useWorkoutLogs';
import { formatDayLabel, todayDateKey } from '../lib/dateUtils';
import { COLORS } from '../theme/tokens';

type Props = {
  navigation: {
    navigate: (screen: 'SessionPicker' | 'WorkoutLog', params: { dateKey?: string; workoutLogId?: string }) => void;
  };
};

type Row =
  | { kind: 'entry'; id: string; entry: NonNullable<ReturnType<typeof useTodayEntriesQuery>['data']>[number] }
  | { kind: 'free'; id: string; log: NonNullable<ReturnType<typeof useFreeWorkoutLogsByDateQuery>['data']>[number] };

export function TodayScreen({ navigation }: Props) {
  const dateKey = todayDateKey();
  const { data: entries, isLoading: isLoadingEntries } = useTodayEntriesQuery();
  const { data: freeLogs, isLoading: isLoadingFreeLogs } = useFreeWorkoutLogsByDateQuery(dateKey);
  const { createWorkoutLog, isPending: isCreatingWorkoutLog } = useCreateWorkoutLog();

  const rows = useMemo<Row[]>(() => {
    const entryRows: Row[] = (entries ?? []).map((entry) => ({ kind: 'entry', id: entry.id, entry }));
    const freeRows: Row[] = (freeLogs ?? []).map((log) => ({ kind: 'free', id: log.id, log }));
    return [...entryRows, ...freeRows];
  }, [entries, freeLogs]);

  const [heroRow, ...restRows] = rows;

  const handleStartFreeSession = () => {
    // L'id est disponible immédiatement (généré côté client) : on peut
    // naviguer tout de suite même hors-ligne, la mutation réelle suit en
    // tâche de fond (ou en attente de réseau).
    const workoutLogId = createWorkoutLog({ sessionName: 'Séance libre', performedDate: dateKey, calendarEntryId: null });
    navigation.navigate('WorkoutLog', { workoutLogId });
  };

  if (isLoadingEntries || isLoadingFreeLogs) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={restRows}
        keyExtractor={(row) => row.id}
        contentContainerClassName="px-6 pb-6 pt-4 gap-3"
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="mb-1 font-bodyMedium text-xs uppercase tracking-widest text-textMuted">
              Aujourd'hui
            </Text>
            <Text className="mb-5 font-display text-2xl capitalize text-text">{formatDayLabel(dateKey)}</Text>

            {heroRow ? (
              <>
                {heroRow.kind === 'entry' ? (
                  <CalendarEntryCard entry={heroRow.entry} size="hero" />
                ) : (
                  <FreeWorkoutLogCard log={heroRow.log} size="hero" />
                )}
                {restRows.length > 0 ? (
                  <View className="mb-1 mt-6">
                    <SteelBar />
                    <Text className="mb-3 mt-4 font-bodyMedium text-sm text-textMuted">Aussi aujourd'hui</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View className="items-start rounded-2xl bg-surface p-6">
                <Text className="mb-4 font-display text-2xl text-text">Aucune séance planifiée</Text>
                <View className="mb-5 w-full">
                  <SteelBar />
                </View>
                <View className="w-full gap-3">
                  <Button label="Ajouter une séance" onPress={() => navigation.navigate('SessionPicker', { dateKey })} />
                  <Button
                    label="Démarrer une séance libre"
                    variant="secondary"
                    onPress={handleStartFreeSession}
                    loading={isCreatingWorkoutLog}
                  />
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'entry' ? <CalendarEntryCard entry={item.entry} /> : <FreeWorkoutLogCard log={item.log} />
        }
        ListFooterComponent={
          heroRow ? (
            <View className="mt-4 gap-3">
              <Button label="Planifier une autre séance" variant="secondary" onPress={() => navigation.navigate('SessionPicker', { dateKey })} />
              <Button label="Démarrer une séance libre" onPress={handleStartFreeSession} loading={isCreatingWorkoutLog} />
            </View>
          ) : null
        }
      />
    </View>
  );
}
