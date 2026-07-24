import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { CalendarEntryCard } from '../components/CalendarEntryCard';
import { FreeWorkoutLogCard } from '../components/FreeWorkoutLogCard';
import { PixelHorizon } from '../components/PixelHorizon';
import { XPBar } from '../components/XPBar';
import { useTodayEntriesQuery } from '../hooks/useCalendarEntries';
import { useCreateWorkoutLog, useFreeWorkoutLogsByDateQuery } from '../hooks/useWorkoutLogs';
import { formatDayLabel, todayDateKey } from '../lib/dateUtils';
import { COLORS } from '../theme/tokens';

// Dégradé signature très assourdi : juste une ambiance de coucher de soleil
// derrière le hero, jamais un aplat franc qui écraserait le contenu.
const HORIZON_WASH = [
  'rgba(255, 46, 146, 0.16)',
  'rgba(255, 107, 53, 0.12)',
  'rgba(0, 240, 255, 0.10)',
  'transparent',
] as const;

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
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={HORIZON_WASH}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 260 }}
      />
      <FlatList
        data={restRows}
        keyExtractor={(row) => row.id}
        contentContainerClassName="px-6 pb-6 pt-4 gap-3"
        ListHeaderComponent={
          <View className="mb-5">
            <View className="mb-1 flex-row items-start justify-between">
              <Text className="font-bodyMedium text-xs uppercase tracking-widest text-textMuted">
                Aujourd'hui
              </Text>
              <PixelHorizon />
            </View>
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
                    <XPBar />
                    <Text className="mb-3 mt-4 font-bodyMedium text-sm text-textMuted">Aussi aujourd'hui</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View className="items-start border-2 border-border bg-surface p-6">
                <Text className="mb-4 font-display text-2xl text-text">Aucune séance planifiée</Text>
                <View className="mb-5 w-full">
                  <XPBar />
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
