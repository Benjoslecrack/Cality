import { Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-textMuted">{label}</Text>
      <TextInput
        className="rounded-xl border border-border bg-surface px-4 py-3 text-base text-text"
        placeholderTextColor="#9AA1AA"
        autoCapitalize="none"
        {...inputProps}
      />
      {error ? <Text className="mt-1 text-sm text-primary">{error}</Text> : null}
    </View>
  );
}
