import { ActivityIndicator, Pressable, Text } from 'react-native';
import { COLORS } from '../theme/tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-11 items-center justify-center rounded-xl py-3 ${
        isPrimary ? 'bg-accent' : 'border border-accentDim bg-transparent'
      } ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? COLORS.onAccent : COLORS.textPrimary} />
      ) : (
        <Text className={`font-bodySemibold text-base ${isPrimary ? 'text-onAccent' : 'text-text'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
