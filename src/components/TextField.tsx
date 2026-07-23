import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { COLORS } from '../theme/tokens';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 font-bodyMedium text-sm text-textMuted">{label}</Text>
      <TextInput
        className="min-h-11 border-2 border-border bg-surface px-4 py-3 font-body text-base text-text"
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        {...inputProps}
      />
      {error ? <Text className="mt-1 font-bodyMedium text-sm text-accent">{error}</Text> : null}
    </View>
  );
}
