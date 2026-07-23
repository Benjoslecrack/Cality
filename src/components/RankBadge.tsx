import { Text, View } from 'react-native';
import { formatRankLabel, RANK_COLORS, RANK_LABELS } from '../lib/rankPresentation';
import type { SkillRank } from '../types/database';

type RankBadgeProps = { rank: SkillRank | null; subLevel?: number };

// null = aucun palier débloqué pour l'instant : un chip neutre plutôt qu'une
// couleur de rang, pour ne pas laisser croire à un rang "Fer" déjà acquis.
// subLevel (1/2/3) affiche le palier précis atteint dans le rang (ex.
// "Bronze II") ; omis, seul le rang macro est affiché.
export function RankBadge({ rank, subLevel }: RankBadgeProps) {
  if (!rank) {
    return (
      <View className="self-start rounded-full border border-textMuted/40 px-2.5 py-0.5">
        <Text className="font-bodyMedium text-xs text-textMuted">Pas encore de rang</Text>
      </View>
    );
  }

  const color = RANK_COLORS[rank];
  return (
    <View
      style={{ borderColor: color, backgroundColor: `${color}26` }}
      className="self-start rounded-full border px-2.5 py-0.5"
    >
      <Text style={{ color }} className="font-bodyMedium text-xs">
        {subLevel != null ? formatRankLabel(rank, subLevel) : RANK_LABELS[rank]}
      </Text>
    </View>
  );
}
