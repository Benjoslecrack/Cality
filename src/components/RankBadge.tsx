import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import { formatRankLabel, RANK_COLORS, RANK_LABELS } from '../lib/rankPresentation';
import { COLORS } from '../theme/tokens';
import type { SkillRank } from '../types/database';

type RankBadgeProps = { rank: SkillRank | null; subLevel?: number };

// Petit médaillon pixel art (5x5) : un losange plein qui sert de "gemme" de
// rang, décliné dans la teinte du palier. Même grille pour les 5 rangs afin
// de garder une silhouette cohérente d'un badge à l'autre.
const GEM_PIXELS = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
];
const GEM_PIXEL_SIZE = 3;

function PixelGem({ color }: { color: string }) {
  return (
    <View>
      {GEM_PIXELS.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.map((lit, x) => (
            <View
              key={x}
              style={{
                width: GEM_PIXEL_SIZE,
                height: GEM_PIXEL_SIZE,
                backgroundColor: lit ? color : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// null = aucun palier débloqué pour l'instant : un chip neutre plutôt qu'une
// couleur de rang, pour ne pas laisser croire à un rang "Fer" déjà acquis.
// subLevel (1/2/3) affiche le palier précis atteint dans le rang (ex.
// "Bronze II") ; omis, seul le rang macro est affiché.
export function RankBadge({ rank, subLevel }: RankBadgeProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const shimmer = useRef(new Animated.Value(0)).current;
  const isMaster = rank === 'master';

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isMaster || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isMaster, reduceMotion, shimmer]);

  if (!rank) {
    return (
      <View className="flex-row items-center gap-1.5 self-start border border-textMuted/40 px-2 py-1">
        <Text className="font-bodyMedium text-xs text-textMuted">Pas encore de rang</Text>
      </View>
    );
  }

  const color = RANK_COLORS[rank];
  // Rang Maître : la gemme alterne magenta <-> cyan pour rendre le palier le
  // plus "éclatant/animé" ; les autres rangs restent statiques dans leur teinte.
  const gemColor = isMaster && !reduceMotion
    ? shimmer.interpolate({ inputRange: [0, 1], outputRange: [COLORS.neonMagenta, COLORS.neonCyan] })
    : color;

  return (
    <View
      style={{ borderColor: color, backgroundColor: `${color}26` }}
      className="flex-row items-center gap-1.5 self-start border-2 px-2 py-1"
    >
      {isMaster ? (
        <Animated.View style={{ opacity: reduceMotion ? 1 : shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }) }}>
          <PixelGemAnimated color={gemColor} />
        </Animated.View>
      ) : (
        <PixelGem color={color} />
      )}
      <Text style={{ color }} className="font-display text-sm">
        {(subLevel != null ? formatRankLabel(rank, subLevel) : RANK_LABELS[rank]).toUpperCase()}
      </Text>
    </View>
  );
}

// Variante de PixelGem acceptant une Animated.AnimatedInterpolation en couleur
// (les View natives ne l'acceptent pas directement en style.backgroundColor
// sur des enfants statiques : on encapsule chaque carré dans un Animated.View).
function PixelGemAnimated({ color }: { color: Animated.AnimatedInterpolation<string> | string }) {
  return (
    <View>
      {GEM_PIXELS.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.map((lit, x) => (
            <Animated.View
              key={x}
              style={{
                width: GEM_PIXEL_SIZE,
                height: GEM_PIXEL_SIZE,
                backgroundColor: lit ? color : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
