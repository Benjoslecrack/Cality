import { useLayoutEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDeleteProgram, useDuplicateProgram, useProgramsQuery } from '../../hooks/usePrograms';
import type { ProgramsStackParamList } from '../../navigation/ProgramsStack';
import { COLORS } from '../../theme/tokens';

type Props = NativeStackScreenProps<ProgramsStackParamList, 'ProgramsList'>;

export function ProgramsListScreen({ navigation }: Props) {
  const { data: programs, isLoading } = useProgramsQuery();
  const deleteProgram = useDeleteProgram();
  const duplicateProgram = useDuplicateProgram();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('ProgramForm', {})} hitSlop={8}>
          <Ionicons name="add" size={26} color={COLORS.textPrimary} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const showActions = (program: NonNullable<typeof programs>[number]) => {
    Alert.alert(program.name, undefined, [
      {
        text: 'Modifier',
        onPress: () =>
          navigation.navigate('ProgramForm', {
            programId: program.id,
            initialName: program.name,
            initialDescription: program.description,
          }),
      },
      { text: 'Dupliquer', onPress: () => duplicateProgram.mutate(program.id) },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Supprimer ce programme ?', 'Cette action est irréversible.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => deleteProgram.mutate(program.id) },
          ]),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-6 gap-3"
        ListEmptyComponent={
          <View className="mt-16 items-center px-6">
            <Text className="mb-2 font-display text-xl text-text">Aucun programme pour l'instant</Text>
            <Text className="text-center text-textMuted">
              Crée ton premier programme (ex. Push / Pull / Legs / Skills) avec le bouton + en haut à droite.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const sessionCount = item.program_sessions?.[0]?.count ?? 0;
          return (
            <Pressable
              onPress={() => navigation.navigate('ProgramDetail', { programId: item.id, programName: item.name })}
              onLongPress={() => showActions(item)}
              className="border-2 border-border bg-surface p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-bodySemibold text-lg text-text">{item.name}</Text>
                <Pressable onPress={() => showActions(item)} hitSlop={8}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
                </Pressable>
              </View>
              {item.description ? (
                <Text className="mt-1 text-textMuted" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text className="mt-3 text-sm text-textMuted">
                {sessionCount} séance{sessionCount > 1 ? 's' : ''}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
