import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { SkillMilestoneBadges } from '../../components/SkillMilestoneBadges';
import { useProgressHistoryQuery } from '../../hooks/useProgressHistory';
import { formatSetValue } from '../../lib/exerciseFormat';
import { progressPoint } from '../../lib/progressValue';
import { aggregateWeeklyBest } from '../../lib/weeklyAggregate';
import { COLORS } from '../../theme/tokens';
import type { SkillKey } from '../../types/database';

type Props = {
  route: { params: { title: string; skillKey?: SkillKey; sessionExerciseId?: string } };
};

export function ProgressHistoryScreen({ route }: Props) {
  const { skillKey, sessionExerciseId } = route.params;
  const filter = skillKey ? { skillKey } : { sessionExerciseId: sessionExerciseId! };
  const { data: history, isLoading } = useProgressHistoryQuery(filter);

  const chartPoints = useMemo(() => {
    if (!history) return [];
    return history
      .map((entry) => {
        const point = progressPoint(entry);
        if (!point || !entry.workout_logs) return null;
        const [, month, day] = entry.workout_logs.performed_date.split('-');
        return { label: `${day}/${month}`, value: point.value, unit: point.unit };
      })
      .filter((p): p is { label: string; value: number; unit: string } => p !== null)
      .slice(-12);
  }, [history]);

  const weeklyTrend = useMemo(() => aggregateWeeklyBest(history ?? [], 3), [history]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const latest = chartPoints[chartPoints.length - 1];
  const previous = chartPoints[chartPoints.length - 2];
  const trend = latest && previous ? Math.sign(latest.value - previous.value) : 0;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-6">
      {latest ? (
        <View className="mb-6 rounded-2xl bg-surface p-4">
          <Text className="font-body text-sm text-textMuted">Dernier record</Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="font-mono text-2xl text-text">
              {latest.value} {latest.unit}
            </Text>
            {trend !== 0 ? (
              <Text className={`font-bodyMedium ${trend > 0 ? 'text-accent' : 'text-textMuted'}`}>
                {trend > 0 ? '▲ progression' : '▼ en baisse'}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="mb-6 items-center rounded-2xl bg-surface p-6">
          <Text className="text-center font-body text-textMuted">
            Pas encore de série loggée pour cet exercice. Log une séance pour voir apparaître ton historique ici.
          </Text>
        </View>
      )}

      {skillKey ? (
        <View className="mb-6">
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Paliers</Text>
          <SkillMilestoneBadges skillKey={skillKey} logs={history ?? []} />
        </View>
      ) : null}

      {chartPoints.length > 1 ? (
        <View className="mb-6">
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Évolution récente</Text>
          <SimpleBarChart points={chartPoints} />
        </View>
      ) : null}

      {weeklyTrend.length > 1 ? (
        <View className="mb-6">
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Tendance (3 mois, par semaine)</Text>
          <SimpleBarChart points={weeklyTrend} />
        </View>
      ) : null}

      {history && history.length > 0 ? (
        <View>
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Historique</Text>
          <View className="gap-2">
            {[...history].reverse().map((entry) => (
              <View key={entry.id} className="flex-row items-center justify-between rounded-xl bg-surface px-4 py-3">
                <View>
                  <Text className="font-body text-text">{entry.exercise_name}</Text>
                  {entry.workout_logs ? (
                    <Text className="font-body text-xs text-textMuted">{entry.workout_logs.performed_date}</Text>
                  ) : null}
                </View>
                <Text className="font-mono text-text">{formatSetValue(entry)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
