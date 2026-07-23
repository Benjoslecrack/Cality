import { Pressable, Text, View } from 'react-native';

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
};

// Contrôle -/+ : évite d'avoir à taper un nombre au clavier en pleine série,
// pensé pour un usage rapide à une main entre deux exercices.
export function Stepper({ label, value, onChange, step = 1, min = 0, max = 999, suffix }: StepperProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <View className="mb-4">
      <Text className="mb-1.5 font-bodyMedium text-sm text-textMuted">{label}</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={decrement}
          className="h-11 w-11 items-center justify-center border-2 border-accent"
        >
          <Text className="font-display text-2xl text-text">–</Text>
        </Pressable>
        <View className="min-w-[84px] flex-1 items-center border-2 border-border bg-surface py-2">
          <Text className="font-mono text-xl text-text">
            {value}
            {suffix ? <Text className="font-mono text-base text-textMuted"> {suffix}</Text> : null}
          </Text>
        </View>
        <Pressable
          onPress={increment}
          className="h-11 w-11 items-center justify-center border-2 border-accent"
        >
          <Text className="font-display text-2xl text-text">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
