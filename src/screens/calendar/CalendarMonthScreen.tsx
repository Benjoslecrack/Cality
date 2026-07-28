import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SessionPreviewCard } from '../../components/SessionPreviewCard';
import { useCalendarEntriesRangeQuery, useDayEntriesQuery } from '../../hooks/useCalendarEntries';
import { useFreeWorkoutLogsRangeQuery } from '../../hooks/useWorkoutLogs';
import {
  addMonths,
  formatDayLabel,
  getMonthGrid,
  isSameDay,
  monthLabel,
  todayDateKey,
  toDateKey,
  weekdayLabels,
} from '../../lib/dateUtils';
import type { CalendarStackParamList } from '../../navigation/CalendarStack';
import { COLORS } from '../../theme/tokens';

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarMonth'>;

// Priorité d'affichage quand un jour a plusieurs entrées de statuts
// différents (rare) : une séance faite l'emporte toujours visuellement,
// même si une autre a été sautée le même jour.
type DotStatus = 'done' | 'skipped' | 'planned';
const DOT_PRIORITY: Record<DotStatus, number> = { done: 3, skipped: 2, planned: 1 };
const DOT_COLORS: Record<DotStatus, string> = {
  done: COLORS.neonCyan,
  skipped: COLORS.sunsetOrange,
  planned: COLORS.textMuted,
};

export function CalendarMonthScreen({ navigation }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => todayDateKey());
  const grid = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const today = new Date();

  const startKey = toDateKey(grid[0].date);
  const endKey = toDateKey(grid[grid.length - 1].date);
  const { data: entries } = useCalendarEntriesRangeQuery(startKey, endKey);
  const { data: freeLogs } = useFreeWorkoutLogsRangeQuery(startKey, endKey);
  const { data: selectedDayEntries } = useDayEntriesQuery(selectedDateKey);

  const statusByDate = useMemo(() => {
    const map = new Map<string, DotStatus>();
    const upsert = (dateKey: string, status: DotStatus) => {
      const current = map.get(dateKey);
      if (!current || DOT_PRIORITY[status] > DOT_PRIORITY[current]) map.set(dateKey, status);
    };
    for (const entry of entries ?? []) {
      upsert(entry.scheduled_date, entry.status);
    }
    // Un log libre n'a pas de statut propre, mais représente une séance
    // réellement faite : compte comme "done" pour le point du jour.
    for (const log of freeLogs ?? []) {
      upsert(log.performed_date, 'done');
    }
    return map;
  }, [entries, freeLogs]);

  const goToPreviousMonth = useCallback(() => setVisibleMonth((month) => addMonths(month, -1)), []);
  const goToNextMonth = useCallback(() => setVisibleMonth((month) => addMonths(month, 1)), []);

  // Geste zoné : seule la grille des jours (pas le header, pas la prévisu en
  // dessous) réagit au swipe horizontal pour changer de mois. En dehors de
  // cette zone, le swipe tombe normalement sur le pager de navigation par
  // onglets (cf. MainTabs). activeOffsetX/failOffsetY laissent passer un
  // simple tap (Pressable des jours) et le scroll vertical du ScrollView.
  const monthSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onEnd((event) => {
          if (event.translationX <= -60) {
            runOnJS(goToNextMonth)();
          } else if (event.translationX >= 60) {
            runOnJS(goToPreviousMonth)();
          }
        }),
    [goToNextMonth, goToPreviousMonth]
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pb-8 pt-4">
      <View className="mb-4 flex-row items-center justify-between px-2">
        <Pressable onPress={goToPreviousMonth} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Pressable onPress={() => setVisibleMonth(new Date())}>
          <Text className="font-display text-xl capitalize text-text">{monthLabel(visibleMonth)}</Text>
        </Pressable>
        <Pressable onPress={goToNextMonth} hitSlop={8}>
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

      <GestureDetector gesture={monthSwipeGesture}>
        <View className="flex-row flex-wrap">
          {grid.map(({ date, inMonth }) => {
            const dateKey = toDateKey(date);
            const isToday = isSameDay(date, today);
            const isSelected = dateKey === selectedDateKey;
            const dotStatus = statusByDate.get(dateKey);

            return (
              <Pressable
                key={dateKey}
                onPress={() => setSelectedDateKey(dateKey)}
                className="aspect-square w-[14.28%] items-center justify-center"
              >
                <View
                  className={`h-10 w-10 items-center justify-center ${
                    isToday
                      ? 'border-2 border-accentDim bg-primary'
                      : isSelected
                        ? 'border-2 border-accentCyan'
                        : ''
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
                {dotStatus ? (
                  <View className="mt-1 h-1.5 w-1.5" style={{ backgroundColor: DOT_COLORS[dotStatus] }} />
                ) : (
                  <View className="mt-1 h-1.5 w-1.5" />
                )}
              </Pressable>
            );
          })}
        </View>
      </GestureDetector>

      <View className="mt-6">
        <Text className="mb-3 font-bodyMedium text-sm capitalize text-textMuted">
          {formatDayLabel(selectedDateKey)}
        </Text>
        {(selectedDayEntries ?? []).length === 0 ? (
          <Text className="font-body text-sm text-textMuted">Rien de prévu ce jour.</Text>
        ) : (
          <View className="gap-3">
            {selectedDayEntries!.map((entry) => (
              <Pressable key={entry.id} onPress={() => navigation.navigate('DayDetail', { dateKey: selectedDateKey })}>
                <SessionPreviewCard entry={entry} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
