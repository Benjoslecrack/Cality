import { useLayoutEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalendarEntryCard } from '../../components/CalendarEntryCard';
import { FreeWorkoutLogCard } from '../../components/FreeWorkoutLogCard';
import { useDayEntriesQuery } from '../../hooks/useCalendarEntries';
import { useFreeWorkoutLogsByDateQuery } from '../../hooks/useWorkoutLogs';
import { formatDayLabel } from '../../lib/dateUtils';
import type { CalendarStackParamList } from '../../navigation/CalendarStack';
import { COLORS } from '../../theme/tokens';

type Props = NativeStackScreenProps<CalendarStackParamList, 'DayDetail'>;

type Row =
  | { kind: 'entry'; id: string; entry: NonNullable<ReturnType<typeof useDayEntriesQuery>['data']>[number] }
  | { kind: 'free'; id: string; log: NonNullable<ReturnType<typeof useFreeWorkoutLogsByDateQuery>['data']>[number] };

export function DayDetailScreen({ navigation, route }: Props) {
  const { dateKey } = route.params;
  const { data: entries, isLoading: isLoadingEntries } = useDayEntriesQuery(dateKey);
  const { data: freeLogs, isLoading: isLoadingFreeLogs } = useFreeWorkoutLogsByDateQuery(dateKey);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: formatDayLabel(dateKey),
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('SessionPicker', { dateKey })} hitSlop={8}>
          <Ionicons name="add" size={26} color={COLORS.textPrimary} />
        </Pressable>
      ),
    });
  }, [navigation, dateKey]);

  const rows = useMemo<Row[]>(() => {
    const entryRows: Row[] = (entries ?? []).map((entry) => ({ kind: 'entry', id: entry.id, entry }));
    const freeRows: Row[] = (freeLogs ?? []).map((log) => ({ kind: 'free', id: log.id, log }));
    return [...entryRows, ...freeRows];
  }, [entries, freeLogs]);

  if (isLoadingEntries || isLoadingFreeLogs) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        contentContainerClassName="px-6 py-6 gap-3"
        ListEmptyComponent={
          <View className="mt-16 items-center px-6">
            <Text className="mb-2 font-display text-xl text-text">Aucune séance prévue</Text>
            <Text className="text-center font-body text-textMuted">
              Assigne une séance à ce jour avec le bouton + en haut à droite.
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'entry' ? <CalendarEntryCard entry={item.entry} /> : <FreeWorkoutLogCard log={item.log} />
        }
      />
    </View>
  );
}
