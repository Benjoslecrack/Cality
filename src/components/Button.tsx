import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { COLORS } from '../theme/tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
};

const SHADOW_OFFSET = 4;

// Bouton "pixel" : coins nets (pas d'arrondi), bordure 2px et ombre pleine
// décalée façon bouton de menu 16-bit. Au press, le bouton glisse dans son
// ombre pour simuler l'enfoncement — grands hitbox tactiles inchangés.
export function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isInactive = disabled || loading;

  return (
    <View style={{ position: 'relative', opacity: isInactive ? 0.5 : 1 }}>
      <View
        style={{
          position: 'absolute',
          top: SHADOW_OFFSET,
          left: SHADOW_OFFSET,
          right: -SHADOW_OFFSET,
          bottom: -SHADOW_OFFSET,
          backgroundColor: isPrimary ? COLORS.accentDim : COLORS.bgSurface,
        }}
      />
      <Pressable
        onPress={onPress}
        disabled={isInactive}
        className={`min-h-11 items-center justify-center border-2 py-3 ${
          isPrimary ? 'border-accentDim bg-accent' : 'border-accent bg-transparent'
        }`}
        style={({ pressed }) => [
          pressed ? { transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }] } : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? COLORS.onAccent : COLORS.textPrimary} />
        ) : (
          <Text className={`font-bodySemibold text-base ${isPrimary ? 'text-onAccent' : 'text-text'}`}>
            {label}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
