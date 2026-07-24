import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCalendarEntriesRangeQuery } from '../../hooks/useCalendarEntries';
import { useFreeWorkoutLogsRangeQuery } from '../../hooks/useWorkoutLogs';
import { addMonths, getMonthGrid, isSameDay, monthLabel, toDateKey, weekdayLabels } from '../../lib/dateUtils';
import type { CalendarStackParamList } from '../../navigation/CalendarStack';
import { COLORS } from '../../theme/tokens';

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarMonth'>;

export function CalendarMonthScreen({ navigation }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const grid = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const today = new Date();

  const startKey = toDateKey(grid[0].date);
  const endKey = toDateKey(grid[grid.length - 1].date);
  const { data: entries } = useCalendarEntriesRangeQuery(startKey, endKey);
  const { data: freeLogs } = useFreeWorkoutLogsRangeQuery(startKey, endKey);

  const entryCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries ?? []) {
      counts.set(entry.scheduled_date, (counts.get(entry.scheduled_date) ?? 0) + 1);
    }
    for (const log of freeLogs ?? []) {
      counts.set(log.performed_date, (counts.get(log.performed_date) ?? 0) + 1);
    }
    return counts;
  }, [entries, freeLogs]);

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <View className="mb-4 flex-row items-center justify-between px-2">
        <Pressable onPress={() => setVisibleMonth((month) => addMonths(month, -1))} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Pressable onPress={() => setVisibleMonth(new Date())}>
          <Text className="font-display text-xl capitalize text-text">{monthLabel(visibleMonth)}</Text>
        </Pressable>
        <Pressable onPress={() => setVisibleMonth((month) => addMonths(month, 1))} hitSlop={8}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      <View className="mb-2 flex-row">
        {weekdayLabels().map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text className="font-bodyMedium text-xs uppercase text-textMuted">{label}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {grid.map(({ date, inMonth }) => {
          const dateKey = toDateKey(date);
          const isToday = isSameDay(date, today);
          const entryCount = entryCountByDate.get(dateKey) ?? 0;

          return (
            <Pressable
              key={dateKey}
              onPress={() => navigation.navigate('DayDetail', { dateKey })}
              className="aspect-square w-[14.28%] items-center justify-center"
            >
              <View
                className={`h-10 w-10 items-center justify-center ${
                  isToday ? 'border-2 border-accentDim bg-primary' : ''
                }`}
              >
                <Text
                  className={`font-mono text-sm ${inMonth ? 'text-text' : 'text-textMuted opacity-40'} ${
                    isToday ? 'text-onAccent' : ''
                  }`}
                >
                  {date.getDate()}
                </Text>
              </View>
              {entryCount > 0 ? (
                <View className="mt-1 h-1.5 w-1.5 bg-accentCyan" />
              ) : (
                <View className="mt-1 h-1.5 w-1.5" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
