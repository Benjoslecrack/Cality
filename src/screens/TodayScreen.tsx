import { useMemo } from 'react';
import { Alert, ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { CalendarEntryCard } from '../components/CalendarEntryCard';
import { FreeWorkoutLogCard } from '../components/FreeWorkoutLogCard';
import { useTodayEntriesQuery } from '../hooks/useCalendarEntries';
import { useCreateWorkoutLog, useFreeWorkoutLogsByDateQuery } from '../hooks/useWorkoutLogs';
import { formatDayLabel, todayDateKey } from '../lib/dateUtils';

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
  const createWorkoutLog = useCreateWorkoutLog();

  const rows = useMemo<Row[]>(() => {
    const entryRows: Row[] = (entries ?? []).map((entry) => ({ kind: 'entry', id: entry.id, entry }));
    const freeRows: Row[] = (freeLogs ?? []).map((log) => ({ kind: 'free', id: log.id, log }));
    return [...entryRows, ...freeRows];
  }, [entries, freeLogs]);

  const handleStartFreeSession = () => {
    createWorkoutLog.mutate(
      { sessionName: 'Séance libre', performedDate: dateKey, calendarEntryId: null },
      {
        onSuccess: (data) => navigation.navigate('WorkoutLog', { workoutLogId: data.id }),
        onError: (error) => Alert.alert('Erreur', (error as Error).message),
      }
    );
  };

  if (isLoadingEntries || isLoadingFreeLogs) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F2545B" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        contentContainerClassName="px-6 pb-6 pt-4 gap-3"
        ListHeaderComponent={
          <Text className="mb-4 text-2xl font-bold capitalize text-text">{formatDayLabel(dateKey)}</Text>
        }
        ListEmptyComponent={
          <View className="mt-8 items-center px-6">
            <Text className="mb-2 text-lg font-semibold text-text">Aucune séance prévue aujourd'hui</Text>
            <Text className="mb-6 text-center text-textMuted">
              Planifie une séance pour aujourd'hui ou repose-toi !
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'entry' ? <CalendarEntryCard entry={item.entry} /> : <FreeWorkoutLogCard log={item.log} />
        }
        ListFooterComponent={
          <View className="mt-4 gap-3">
            <Button label="Planifier une séance" variant="secondary" onPress={() => navigation.navigate('SessionPicker', { dateKey })} />
            <Button label="Démarrer une séance libre" onPress={handleStartFreeSession} loading={createWorkoutLog.isPending} />
          </View>
        }
      />
    </View>
  );
}
