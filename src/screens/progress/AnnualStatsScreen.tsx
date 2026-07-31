import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { useAnnualExerciseLogsQuery } from '../../hooks/useProgressHistory';
import { aggregateAnnualTotals, aggregateByExercise, formatDuration } from '../../lib/annualAggregate';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';

const CURRENT_YEAR = new Date().getFullYear();

export function AnnualStatsScreen() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const { data: entries, isLoading } = useAnnualExerciseLogsQuery(year);

  const totals = useMemo(() => aggregateAnnualTotals(entries ?? []), [entries]);
  const breakdown = useMemo(() => aggregateByExercise(entries ?? []), [entries]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-6">
      <View className="mb-6 flex-row items-center justify-center gap-4">
        <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="font-display text-xl text-text">{year}</Text>
        <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={8} disabled={year >= CURRENT_YEAR}>
          <Ionicons name="chevron-forward" size={22} color={year >= CURRENT_YEAR ? COLORS.textMuted : COLORS.textPrimary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.neonCyan} />
      ) : (
        <>
          <View style={CARD_SHADOW} className="mb-3 items-center border-2 border-border bg-surface p-6">
            <Text className="font-bodyMedium text-sm uppercase text-textMuted">Répétitions cumulées</Text>
            <Text className="mt-1 font-displayBold text-5xl text-accent">{totals.totalReps.toLocaleString('fr-FR')}</Text>
          </View>

          {totals.totalHoldSeconds > 0 ? (
            <View style={CARD_SHADOW} className="mb-8 items-center border-2 border-border bg-surface p-4">
              <Text className="font-bodyMedium text-xs uppercase text-textMuted">Temps de maintien cumulé</Text>
              <Text className="mt-1 font-display text-2xl text-accentCyan">{formatDuration(totals.totalHoldSeconds)}</Text>
            </View>
          ) : (
            <View className="mb-8" />
          )}

          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Répartition par exercice</Text>
          {breakdown.length === 0 ? (
            <View style={CARD_SHADOW} className="items-center border-2 border-border bg-surface p-6">
              <Text className="text-center font-body text-textMuted">
                Aucune répétition loggée en {year}.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {breakdown.map((exercise) => {
                const isExpanded = expandedExercise === exercise.exerciseName;
                return (
                  <Pressable
                    key={exercise.exerciseName}
                    style={CARD_SHADOW}
                    className="border-2 border-border bg-surface p-4"
                    onPress={() => setExpandedExercise(isExpanded ? null : exercise.exerciseName)}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 pr-3 font-bodySemibold text-base text-text">{exercise.exerciseName}</Text>
                      <Text className="font-mono text-base text-text">
                        {exercise.totalReps.toLocaleString('fr-FR')} reps
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textMuted}
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                    {isExpanded ? (
                      <View className="mt-4">
                        <SimpleBarChart points={exercise.monthly} unit="reps" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
