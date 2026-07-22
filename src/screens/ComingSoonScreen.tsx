import { Text, View } from 'react-native';

export function ComingSoonScreen({ title }: { title: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="mb-2 text-xl font-semibold text-text">{title}</Text>
      <Text className="text-center text-textMuted">
        Cet écran arrive dans une prochaine étape de la construction de l'app.
      </Text>
    </View>
  );
}
