import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { useAllExerciseLogsQuery, useProgressHistoryQuery } from '../../hooks/useProgressHistory';
import { progressPoint } from '../../lib/progressValue';
import { SKILL_MILESTONES } from '../../lib/skillMilestones';
import { SKILLS } from '../../lib/skills';
import { aggregateWeeklySetCount } from '../../lib/weeklyAggregate';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';
import type { SkillsStackParamList } from '../../navigation/SkillsStack';
import type { SkillKey } from '../../types/database';

type Props = NativeStackScreenProps<SkillsStackParamList, 'SkillsList'>;

export function SkillsListScreen({ navigation }: Props) {
  const { data: allLogs } = useAllExerciseLogsQuery(3);
  const weeklyVolume = useMemo(() => aggregateWeeklySetCount(allLogs ?? [], 3), [allLogs]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-6 gap-3">
      <Pressable
        onPress={() => navigation.navigate('PhotoTimeline')}
        style={CARD_SHADOW}
        className="mb-3 flex-row items-center justify-between rounded-2xl bg-surface p-4"
      >
        <View className="flex-row items-center gap-3">
          <Ionicons name="images-outline" size={20} color={COLORS.accent} />
          <Text className="font-bodySemibold text-base text-text">Photos de progression</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </Pressable>

      {weeklyVolume.length > 1 ? (
        <View style={CARD_SHADOW} className="mb-3 rounded-2xl bg-surface p-4">
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">
            Volume d'entraînement — séries par semaine
          </Text>
          <SimpleBarChart points={weeklyVolume} />
        </View>
      ) : null}

      {SKILLS.map((skill) => (
        <SkillCard
          key={skill.key}
          skillKey={skill.key}
          label={skill.label}
          onPress={() => navigation.navigate('SkillDetail', { skillKey: skill.key, title: skill.label })}
        />
      ))}
    </ScrollView>
  );
}

function SkillCard({ skillKey, label, onPress }: { skillKey: SkillKey; label: string; onPress: () => void }) {
  const { data: history, isLoading } = useProgressHistoryQuery({ skillKey });

  const { latest, trend, unlockedCount } = useMemo(() => {
    const logs = history ?? [];
    const points = logs.map((entry) => progressPoint(entry)).filter((p): p is { value: number; unit: string } => p !== null);
    const last = points[points.length - 1] ?? null;
    const beforeLast = points[points.length - 2] ?? null;
    const t = last && beforeLast ? Math.sign(last.value - beforeLast.value) : 0;
    const unlocked = SKILL_MILESTONES[skillKey].filter((m) => m.check(logs)).length;
    return { latest: last, trend: t, unlockedCount: unlocked };
  }, [history, skillKey]);

  const totalMilestones = SKILL_MILESTONES[skillKey].length;

  return (
    <Pressable onPress={onPress} style={CARD_SHADOW} className="flex-row items-center justify-between rounded-2xl bg-surface p-4">
      <View className="flex-1 pr-2">
        <Text className="font-bodySemibold text-base text-text">{label}</Text>
        {isLoading ? (
          <Text className="mt-1 font-body text-sm text-textMuted">Chargement...</Text>
        ) : latest ? (
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="font-mono text-sm text-textMuted">
              Record : {latest.value} {latest.unit}
            </Text>
            {trend !== 0 ? (
              <Text className={`font-bodyMedium ${trend > 0 ? 'text-accent' : 'text-textMuted'}`}>{trend > 0 ? '▲' : '▼'}</Text>
            ) : null}
          </View>
        ) : (
          <Text className="mt-1 font-body text-sm text-textMuted">Pas encore de données</Text>
        )}
        <Text className="mt-1 font-bodyMedium text-xs text-textMuted">
          {unlockedCount}/{totalMilestones} paliers
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </Pressable>
  );
}
