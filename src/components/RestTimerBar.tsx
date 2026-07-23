import { Pressable, Text, View } from 'react-native';
import { useRestTimer } from '../contexts/RestTimerContext';
import { CARD_SHADOW } from '../theme/tokens';
import { XPBar } from './XPBar';

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Barre persistante (montée une seule fois près de la racine de la nav) : elle
// s'affiche dès qu'un repos est en cours, quel que soit l'écran d'où il a été
// lancé (logging classique, mode guidé...).
export function RestTimerBar() {
  const { isActive, isFinished, exerciseName, totalSeconds, remainingSeconds, addTime, skip } = useRestTimer();

  if (!isActive && !isFinished) return null;

  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 1;

  return (
    <View style={CARD_SHADOW} className="mx-4 mb-2 border-2 border-border bg-surface p-4">
      {isFinished ? (
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-base uppercase text-accent">Repos terminé</Text>
          <Pressable onPress={skip} className="min-h-11 justify-center border-2 border-accentDim bg-accent px-4">
            <Text className="font-bodySemibold text-sm text-onAccent">OK</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-bodyMedium text-sm text-textMuted" numberOfLines={1}>
              Repos — {exerciseName}
            </Text>
            <Text className="font-display text-2xl text-text">{formatClock(remainingSeconds)}</Text>
          </View>
          <View className="mb-3">
            <XPBar progress={progress} />
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => addTime(-15)} className="min-h-11 flex-1 items-center justify-center border-2 border-accentDim">
              <Text className="font-bodyMedium text-sm text-text">−15s</Text>
            </Pressable>
            <Pressable onPress={() => addTime(15)} className="min-h-11 flex-1 items-center justify-center border-2 border-accentDim">
              <Text className="font-bodyMedium text-sm text-text">+15s</Text>
            </Pressable>
            <Pressable onPress={skip} className="min-h-11 flex-1 items-center justify-center border-2 border-transparent">
              <Text className="font-bodyMedium text-sm text-textMuted">Passer</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
