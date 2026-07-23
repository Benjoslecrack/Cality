import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/tokens';

type SteelBarProps = {
  /** 0 à 1. Omis : la barre sert de simple séparateur (piste vide, pas de remplissage). */
  progress?: number;
  height?: number;
  /** Déclenche une fois le flash accent quand un record personnel vient d'être battu. */
  justRecorded?: boolean;
};

const ACCENT_FLASH_MS = 900;

// Élément graphique signature de l'app : une barre d'acier stylisée (piste +
// reflet horizontal + embouts plus sombres). Sert à la fois de séparateur de
// section (sans `progress`) et de barre de progression sur les skills (avec).
export function SteelBar({ progress, height = 6, justRecorded = false }: SteelBarProps) {
  const clamped = progress != null ? Math.max(0, Math.min(1, progress)) : null;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!justRecorded) return;
    if (reduceMotion) return; // état final directement, pas d'animation
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: ACCENT_FLASH_MS,
      useNativeDriver: true,
    }).start();
  }, [justRecorded, reduceMotion, flashOpacity]);

  const capWidth = Math.max(height, 8);

  return (
    <View
      style={{ height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: COLORS.bgSurface }}
    >
      {clamped != null ? (
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamped * 100}%` }}>
          <LinearGradient
            colors={[COLORS.accentDim, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}

      {/* Reflet : dégradé horizontal clair et subtil, façon barre en acier poli */}
      <LinearGradient
        colors={['transparent', 'rgba(237,237,230,0.14)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '55%' }}
      />

      {/* Embouts plus sombres aux extrémités, comme les manchons d'une barre de traction */}
      <View
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: capWidth, backgroundColor: 'rgba(20,23,26,0.45)' }}
      />
      <View
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: capWidth, backgroundColor: 'rgba(20,23,26,0.45)' }}
      />

      {justRecorded ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: COLORS.accent,
            opacity: flashOpacity,
          }}
        />
      ) : null}
    </View>
  );
}
