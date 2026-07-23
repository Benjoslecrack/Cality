import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';
import { useSkillCatalogQuery, useToggleSkillSelection, useUserSkillSelectionQuery } from '../../hooks/useSkillRanks';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';

// Désactiver un skill ne supprime aucune donnée : seule la ligne de
// user_skill_selection est retirée (cf. migration 0005), la progression et
// l'historique restent intacts et réapparaissent si le skill est réactivé.
export function SkillSelectionScreen() {
  const { data: catalog, isLoading: loadingCatalog } = useSkillCatalogQuery();
  const { data: activeIdList, isLoading: loadingSelection } = useUserSkillSelectionQuery();
  const activeIds = useMemo(() => new Set(activeIdList ?? []), [activeIdList]);
  const toggle = useToggleSkillSelection();

  if (loadingCatalog || loadingSelection) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-6 gap-3">
      <Text className="mb-1 font-body text-sm text-textMuted">
        Choisis les skills que tu travailles activement. Ils seront mis en avant dans la vue Skills — les autres
        restent accessibles via "Voir tous les skills", sans rien perdre de leur progression.
      </Text>

      {(catalog ?? []).map((skill) => {
        const active = activeIds.has(skill.id);
        return (
          <View
            key={skill.id}
            style={CARD_SHADOW}
            className="flex-row items-center justify-between rounded-2xl bg-surface p-4"
          >
            <Text className="flex-1 pr-3 font-bodyMedium text-base text-text">{skill.name}</Text>
            <Switch
              value={active}
              onValueChange={(value) => toggle.mutate({ skillId: skill.id, active: value })}
              trackColor={{ false: COLORS.bgNight, true: COLORS.accentDim }}
              thumbColor={active ? COLORS.neonMagenta : COLORS.textMuted}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}
