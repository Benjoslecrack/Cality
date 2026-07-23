import { useLayoutEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDeleteSessionExercise, useSessionExercisesQuery } from '../../hooks/useSessionExercises';
import { useSkillCatalogQuery } from '../../hooks/useSkillRanks';
import { EXERCISE_TYPE_LABELS, formatExerciseTarget } from '../../lib/exerciseFormat';
import type { ProgramsStackParamList } from '../../navigation/ProgramsStack';

type Props = NativeStackScreenProps<ProgramsStackParamList, 'SessionEditor'>;

export function SessionEditorScreen({ navigation, route }: Props) {
  const { programSessionId } = route.params;
  const { data: exercises, isLoading } = useSessionExercisesQuery(programSessionId);
  const { data: catalog } = useSkillCatalogQuery();
  const deleteExercise = useDeleteSessionExercise(programSessionId);
  const skillNameById = new Map((catalog ?? []).map((skill) => [skill.id, skill.name]));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('ExerciseForm', { programSessionId })} hitSlop={8}>
          <Ionicons name="add" size={26} color="#F5F6F7" />
        </Pressable>
      ),
    });
  }, [navigation, programSessionId]);

  const showActions = (item: NonNullable<typeof exercises>[number]) => {
    Alert.alert(item.name, undefined, [
      {
        text: "Voir l'historique",
        onPress: () => navigation.navigate('ExerciseHistory', { sessionExerciseId: item.id, title: item.name }),
      },
      {
        text: 'Modifier',
        onPress: () =>
          navigation.navigate('ExerciseForm', {
            programSessionId,
            exerciseId: item.id,
            initialValues: {
              name: item.name,
              type: item.type,
              skill_id: item.skill_id,
              target_sets: item.target_sets,
              target_reps: item.target_reps,
              target_weight_kg: item.target_weight_kg,
              target_hold_seconds: item.target_hold_seconds,
              target_rest_seconds: item.target_rest_seconds,
              progression_variant: item.progression_variant,
              notes: item.notes,
            },
          }),
      },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Supprimer cet exercice ?', undefined, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => deleteExercise.mutate(item.id) },
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
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-6 gap-3"
        ListEmptyComponent={
          <View className="mt-16 items-center px-6">
            <Text className="mb-2 text-lg font-semibold text-text">Aucun exercice pour l'instant</Text>
            <Text className="text-center text-textMuted">
              Ajoute un exercice avec le bouton + en haut à droite.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => showActions(item)}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-text">{item.name}</Text>
              {item.skill_id && skillNameById.has(item.skill_id) ? (
                <View className="rounded-full border border-primary bg-primaryMuted px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-text">{skillNameById.get(item.skill_id)}</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1 text-sm text-textMuted">{EXERCISE_TYPE_LABELS[item.type]}</Text>
            <Text className="mt-2 text-base text-text">{formatExerciseTarget(item)}</Text>
            {item.notes ? <Text className="mt-2 text-sm text-textMuted">{item.notes}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}
