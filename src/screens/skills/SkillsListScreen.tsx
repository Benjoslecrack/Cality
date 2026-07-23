import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RankBadge } from '../../components/RankBadge';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { SteelBar } from '../../components/SteelBar';
import { useAllExerciseLogsQuery } from '../../hooks/useProgressHistory';
import {
  useSkillCatalogQuery,
  useSkillLogsQuery,
  useUserSkillProgressQuery,
  useUserSkillSelectionQuery,
  type SkillCatalogEntry,
} from '../../hooks/useSkillRanks';
import { formatRankLabel, RANK_COLORS } from '../../lib/rankPresentation';
import { highestUnlockedTier, nextLockedTier, tierProgress } from '../../lib/skillRanks';
import { aggregateWeeklySetCount } from '../../lib/weeklyAggregate';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';
import type { SkillsStackParamList } from '../../navigation/SkillsStack';

type Props = NativeStackScreenProps<SkillsStackParamList, 'SkillsList'>;

export function SkillsListScreen({ navigation }: Props) {
  const { data: allLogs } = useAllExerciseLogsQuery(3);
  const { data: catalog, isLoading: loadingCatalog } = useSkillCatalogQuery();
  const { data: activeIdList, isLoading: loadingSelection } = useUserSkillSelectionQuery();
  const { data: progress } = useUserSkillProgressQuery();
  const [showAll, setShowAll] = useState(false);

  const activeIds = useMemo(() => new Set(activeIdList ?? []), [activeIdList]);

  const weeklyVolume = useMemo(() => aggregateWeeklySetCount(allLogs ?? [], 3), [allLogs]);

  const unlockedTierIdsBySkill = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const entry of progress ?? []) {
      if (!map.has(entry.skillId)) map.set(entry.skillId, new Set());
      map.get(entry.skillId)!.add(entry.skillTierId);
    }
    return map;
  }, [progress]);

  const visibleSkills = useMemo(() => {
    if (!catalog) return [];
    if (showAll) return catalog;
    return catalog.filter((skill) => activeIds.has(skill.id));
  }, [catalog, activeIds, showAll]);

  if (loadingCatalog || loadingSelection) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-6 gap-3">
      <Pressable
        onPress={() => navigation.navigate('PhotoTimeline')}
        style={CARD_SHADOW}
        className="mb-1 flex-row items-center justify-between rounded-2xl bg-surface p-4"
      >
        <View className="flex-row items-center gap-3">
          <Ionicons name="images-outline" size={20} color={COLORS.accent} />
          <Text className="font-bodySemibold text-base text-text">Photos de progression</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('SkillSelection')}
        style={CARD_SHADOW}
        className="mb-2 flex-row items-center justify-between rounded-2xl bg-surface p-4"
      >
        <View className="flex-row items-center gap-3">
          <Ionicons name="options-outline" size={20} color={COLORS.accent} />
          <Text className="font-bodySemibold text-base text-text">Sélectionner mes skills</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </Pressable>

      {weeklyVolume.length > 1 ? (
        <View style={CARD_SHADOW} className="mb-1 rounded-2xl bg-surface p-4">
          <Text className="mb-3 font-bodyMedium text-sm text-textMuted">
            Volume d'entraînement — séries par semaine
          </Text>
          <SimpleBarChart points={weeklyVolume} />
        </View>
      ) : null}

      {visibleSkills.length === 0 && !showAll ? (
        <View style={CARD_SHADOW} className="items-center rounded-2xl bg-surface p-6">
          <Text className="text-center font-body text-textMuted">
            Aucun skill actif pour l'instant. Choisis ceux que tu travailles en ce moment.
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {visibleSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              unlockedTierIds={unlockedTierIdsBySkill.get(skill.id) ?? new Set()}
              onPress={() => navigation.navigate('SkillDetail', { skillId: skill.id, title: skill.name })}
            />
          ))}
        </View>
      )}

      <Pressable onPress={() => setShowAll((v) => !v)} className="mt-1 items-center py-2">
        <Text className="font-bodyMedium text-sm text-accent">
          {showAll ? 'Filtrer sur mes skills actifs' : 'Voir tous les skills'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function SkillCard({
  skill,
  unlockedTierIds,
  onPress,
}: {
  skill: SkillCatalogEntry;
  unlockedTierIds: Set<string>;
  onPress: () => void;
}) {
  const { data: logs } = useSkillLogsQuery(skill.id);

  const { highest, next, progress } = useMemo(() => {
    const nextTier = nextLockedTier(skill.tiers, unlockedTierIds);
    return {
      highest: highestUnlockedTier(skill.tiers, unlockedTierIds),
      next: nextTier,
      progress: nextTier ? tierProgress(nextTier, logs ?? []) : 1,
    };
  }, [skill, unlockedTierIds, logs]);

  return (
    <Pressable onPress={onPress} style={CARD_SHADOW} className="mb-3 w-[48%] rounded-2xl bg-surface p-4">
      <Text className="mb-2 font-bodySemibold text-base text-text">{skill.name}</Text>
      <RankBadge rank={highest?.rank ?? null} subLevel={highest?.subLevel} />
      <View className="mt-3">
        <SteelBar
          progress={progress}
          fillColors={next ? [COLORS.textMuted, RANK_COLORS[next.rank]] : [RANK_COLORS.master, RANK_COLORS.master]}
        />
        <Text className="mt-1.5 font-body text-xs text-textMuted" numberOfLines={1}>
          {next ? `Prochain : ${formatRankLabel(next.rank, next.subLevel)}` : 'Maître III atteint'}
        </Text>
      </View>
    </Pressable>
  );
}
