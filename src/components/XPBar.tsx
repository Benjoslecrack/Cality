import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { COLORS } from '../theme/tokens';

type XPBarProps = {
  /** 0 à 1. Omis : la barre sert de simple séparateur (segments éteints, décoratifs). */
  progress?: number;
  height?: number;
  /** Déclenche une fois le flash magenta quand un record personnel vient d'être battu. */
  justRecorded?: boolean;
  /** Déclenche une fois le flash cyan, quand un palier de skill vient d'être débloqué. */
  justRanked?: boolean;
  /** [couleur de fond des segments non éclairés, couleur des segments éclairés]. Défaut [accentDim, neonMagenta]. */
  fillColors?: readonly [string, string];
};

const SEGMENTS = 10;
const GAP = 2;
const FLASH_MS = 900;
const STAGGER_MS = 45;

// Élément graphique signature de l'app : une barre de vie/XP façon RPG
// 16-bit — segments pixelisés nets (pas de dégradé lisse) qui s'allument un
// par un à mesure que la progression augmente. Sert à la fois de séparateur
// de section (sans `progress`) et de barre de progression sur les skills.
export function XPBar({
  progress,
  height = 10,
  justRecorded = false,
  justRanked = false,
  fillColors = [COLORS.accentDim, COLORS.neonMagenta],
}: XPBarProps) {
  const clamped = progress != null ? Math.max(0, Math.min(1, progress)) : 0;
  const filledCount = progress != null ? Math.round(clamped * SEGMENTS) : 0;
  const [trackColor, litColor] = fillColors;

  const segmentOpacities = useRef(Array.from({ length: SEGMENTS }, () => new Animated.Value(0))).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const flashing = justRecorded || justRanked;
  const flashColor = justRanked ? COLORS.neonCyan : COLORS.neonMagenta;
  const previousFilledCount = useRef(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const from = previousFilledCount.current;
    previousFilledCount.current = filledCount;

    if (reduceMotion) {
      segmentOpacities.forEach((value, index) => value.setValue(index < filledCount ? 1 : 0));
      return;
    }

    if (filledCount <= from) {
      // Progression qui redescend (ex. nouveau skill sélectionné) : pas
      // d'animation de "déblocage", on affiche l'état final directement.
      segmentOpacities.forEach((value, index) => value.setValue(index < filledCount ? 1 : 0));
      return;
    }

    const reveals = segmentOpacities
      .slice(from, filledCount)
      .map((value) => Animated.timing(value, { toValue: 1, duration: 120, useNativeDriver: true }));
    Animated.stagger(STAGGER_MS, reveals).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCount, reduceMotion]);

  useEffect(() => {
    if (!flashing) return;
    if (reduceMotion) return; // état final directement, pas d'animation
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: FLASH_MS,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justRecorded, justRanked, reduceMotion, flashOpacity]);

  return (
    <View style={{ flexDirection: 'row', height, gap: GAP }}>
      {segmentOpacities.map((opacity, index) => (
        <View
          key={index}
          style={{ flex: 1, backgroundColor: trackColor, overflow: 'hidden' }}
        >
          {progress != null ? (
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: litColor,
                opacity,
              }}
            />
          ) : null}
          {flashing ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: flashColor,
                opacity: flashOpacity,
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
