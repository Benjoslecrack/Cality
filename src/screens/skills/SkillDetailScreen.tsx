import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RankBadge } from '../../components/RankBadge';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { SteelBar } from '../../components/SteelBar';
import { useSkillCatalogQuery, useSkillLogsQuery, useUserSkillProgressQuery } from '../../hooks/useSkillRanks';
import { formatSetValue } from '../../lib/exerciseFormat';
import { progressPoint } from '../../lib/progressValue';
import { formatRankLabel, RANK_COLORS } from '../../lib/rankPresentation';
import { highestUnlockedTier, nextLockedTier, tierProgress } from '../../lib/skillRanks';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';
import type { SkillsStackParamList } from '../../navigation/SkillsStack';

type Props = NativeStackScreenProps<SkillsStackParamList, 'SkillDetail'>;

function dayLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
}

export function SkillDetailScreen({ route }: Props) {
  const { skillId } = route.params;
  const { data: catalog, isLoading: loadingCatalog } = useSkillCatalogQuery();
  const { data: progress, isLoading: loadingProgress } = useUserSkillProgressQuery();
  const { data: logs, isLoading: loadingLogs } = useSkillLogsQuery(skillId);

  const skill = catalog?.find((s) => s.id === skillId);

  const achievedAtByTierId = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of progress ?? []) {
      if (entry.skillId === skillId) map.set(entry.skillTierId, entry.achievedAt);
    }
    return map;
  }, [progress, skillId]);

  const unlockedTierIds = useMemo(() => new Set(achievedAtByTierId.keys()), [achievedAtByTierId]);

  const { holdPoints, repPoints } = useMemo(() => {
    const points = (logs ?? [])
      .map((log) => ({ log, point: progressPoint(log) }))
      .filter((p): p is { log: typeof p.log; point: { value: number; unit: string } } => p.point !== null);

    const toChartPoint = (p: (typeof points)[number]) => ({
      label: dayLabel(p.log.performedDate ?? p.log.createdAt.slice(0, 10)),
      value: p.point.value,
    });

    return {
      holdPoints: points.filter((p) => p.point.unit === 's').slice(-12).map(toChartPoint),
      repPoints: points.filter((p) => p.point.unit !== 's').slice(-12).map(toChartPoint),
    };
  }, [logs]);

  if (loadingCatalog || loadingProgress || loadingLogs || !skill) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const highest = highestUnlockedTier(skill.tiers, unlockedTierIds);
  const next = nextLockedTier(skill.tiers, unlockedTierIds);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-6">
      <RankBadge rank={highest?.rank ?? null} subLevel={highest?.subLevel} />

      {next ? (
        <View style={CARD_SHADOW} className="mb-6 mt-3 rounded-2xl bg-surface p-4">
          <Text className="font-bodyMedium text-sm text-textMuted">Prochain objectif</Text>
          <Text className="mt-1 font-bodyMedium text-xs" style={{ color: RANK_COLORS[next.rank] }}>
            {formatRankLabel(next.rank, next.subLevel)}
          </Text>
          <Text className="mt-1 font-display text-2xl text-text">{next.label}</Text>
          <View className="mt-3">
            <SteelBar progress={tierProgress(next, logs ?? [])} fillColors={[COLORS.textMuted, RANK_COLORS[next.rank]]} />
          </View>
        </View>
      ) : (
        <View style={CARD_SHADOW} className="mb-6 mt-3 items-center rounded-2xl bg-surface p-6">
          <Text className="text-center font-bodySemibold text-base text-accent">
            Rang Maître III atteint sur ce skill. Bravo !
          </Text>
        </View>
      )}

      <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Paliers</Text>
      <View className="mb-6 gap-2">
        {skill.tiers.map((tier) => {
          const achievedAt = achievedAtByTierId.get(tier.id);
          const unlocked = !!achievedAt;
          return (
            <View
              key={tier.id}
              style={CARD_SHADOW}
              className={`flex-row items-center rounded-xl bg-surface px-4 py-3 ${unlocked ? '' : 'opacity-60'}`}
            >
              <Ionicons
                name={unlocked ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={unlocked ? RANK_COLORS[tier.rank] : COLORS.textMuted}
              />
              <View className="ml-3 flex-1">
                <Text className="font-bodyMedium text-xs" style={{ color: RANK_COLORS[tier.rank] }}>
                  {formatRankLabel(tier.rank, tier.subLevel)}
                </Text>
                <Text className="font-body text-sm text-text">{tier.label}</Text>
              </View>
              {achievedAt ? (
                <Text className="font-mono text-xs text-textMuted">{dayLabel(achievedAt.slice(0, 10))}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {holdPoints.length > 1 ? (
        <View className="mb-6">
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Tendance — temps de maintien (s)</Text>
          <SimpleBarChart points={holdPoints} />
        </View>
      ) : null}

      {repPoints.length > 1 ? (
        <View className="mb-6">
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Tendance — répétitions</Text>
          <SimpleBarChart points={repPoints} />
        </View>
      ) : null}

      {logs && logs.length > 0 ? (
        <View>
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Historique</Text>
          <View className="gap-2">
            {[...logs].reverse().map((log) => (
              <View key={log.id} className="flex-row items-center justify-between rounded-xl bg-surface px-4 py-3">
                <Text className="font-body text-xs text-textMuted">
                  {dayLabel(log.performedDate ?? log.createdAt.slice(0, 10))}
                </Text>
                <Text className="font-mono text-sm text-text">{formatSetValue(log)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={CARD_SHADOW} className="items-center rounded-2xl bg-surface p-6">
          <Text className="text-center font-body text-textMuted">
            Pas encore de série loggée pour ce skill. Log une séance pour voir apparaître ton historique ici.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
