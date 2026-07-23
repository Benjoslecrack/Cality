import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProgressHistoryQuery } from '../../hooks/useProgressHistory';
import { progressPoint } from '../../lib/progressValue';
import { SKILLS } from '../../lib/skills';
import type { SkillsStackParamList } from '../../navigation/SkillsStack';
import type { SkillKey } from '../../types/database';

type Props = NativeStackScreenProps<SkillsStackParamList, 'SkillsList'>;

export function SkillsListScreen({ navigation }: Props) {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-6 gap-3">
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

  const { latest, trend } = useMemo(() => {
    const points = (history ?? [])
      .map((entry) => progressPoint(entry))
      .filter((p): p is { value: number; unit: string } => p !== null);
    const last = points[points.length - 1] ?? null;
    const beforeLast = points[points.length - 2] ?? null;
    const t = last && beforeLast ? Math.sign(last.value - beforeLast.value) : 0;
    return { latest: last, trend: t };
  }, [history]);

  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between rounded-2xl border border-border bg-surface p-4">
      <View className="flex-1 pr-2">
        <Text className="text-base font-semibold text-text">{label}</Text>
        {isLoading ? (
          <Text className="mt-1 text-sm text-textMuted">Chargement...</Text>
        ) : latest ? (
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="text-sm text-textMuted">
              Record : {latest.value} {latest.unit}
            </Text>
            {trend !== 0 ? (
              <Text className={trend > 0 ? 'text-success' : 'text-warning'}>{trend > 0 ? '▲' : '▼'}</Text>
            ) : null}
          </View>
        ) : (
          <Text className="mt-1 text-sm text-textMuted">Pas encore de données</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9AA1AA" />
    </Pressable>
  );
}
