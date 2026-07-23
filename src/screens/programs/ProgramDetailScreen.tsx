import { useLayoutEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useDeleteProgramSession,
  useProgramSessionsQuery,
} from '../../hooks/useProgramSessions';
import type { ProgramsStackParamList } from '../../navigation/ProgramsStack';

type Props = NativeStackScreenProps<ProgramsStackParamList, 'ProgramDetail'>;

export function ProgramDetailScreen({ navigation, route }: Props) {
  const { programId } = route.params;
  const { data: sessions, isLoading } = useProgramSessionsQuery(programId);
  const deleteSession = useDeleteProgramSession(programId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('SessionForm', { programId })} hitSlop={8}>
          <Ionicons name="add" size={26} color="#F5F6F7" />
        </Pressable>
      ),
    });
  }, [navigation, programId]);

  const showActions = (item: NonNullable<typeof sessions>[number]) => {
    Alert.alert(item.name, undefined, [
      {
        text: 'Renommer',
        onPress: () => navigation.navigate('SessionForm', { programId, sessionId: item.id, initialName: item.name }),
      },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Supprimer cette séance ?', 'Les exercices associés seront aussi supprimés.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => deleteSession.mutate(item.id) },
          ]),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F2545B" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-6 gap-3"
        ListEmptyComponent={
          <View className="mt-16 items-center px-6">
            <Text className="mb-2 text-lg font-semibold text-text">Aucune séance pour l'instant</Text>
            <Text className="text-center text-textMuted">
              Ajoute une séance type (ex. Push, Pull, Legs, Skills) avec le bouton + en haut à droite.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const exerciseCount = item.session_exercises?.[0]?.count ?? 0;
          return (
            <Pressable
              onPress={() => navigation.navigate('SessionEditor', { programSessionId: item.id, sessionName: item.name })}
              onLongPress={() => showActions(item)}
              className="flex-row items-center justify-between rounded-2xl border border-border bg-surface p-4"
            >
              <View>
                <Text className="text-lg font-semibold text-text">{item.name}</Text>
                <Text className="mt-1 text-sm text-textMuted">
                  {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
                </Text>
              </View>
              <Pressable onPress={() => showActions(item)} hitSlop={8}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9AA1AA" />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
