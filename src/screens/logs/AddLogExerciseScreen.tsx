import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useSkillCatalogQuery } from '../../hooks/useSkillRanks';
import { EXERCISE_TYPE_LABELS } from '../../lib/exerciseFormat';
import type { ExerciseType } from '../../types/database';

const EXERCISE_TYPES: ExerciseType[] = ['reps_weight', 'isometric', 'progression'];

type Props = {
  route: { params: { workoutLogId: string } };
  navigation: {
    navigate: (
      screen: 'SetForm',
      params: {
        workoutLogId: string;
        sessionExerciseId: null;
        exerciseName: string;
        type: ExerciseType;
        skillKey: null;
        skillId: string | null;
      }
    ) => void;
  };
};

// Ajoute un exercice "à la volée" à une séance libre (ou en plus du plan) :
// pas de session_exercises associée, exercise_name/type sont capturés
// directement sur les exercise_logs.
export function AddLogExerciseScreen({ navigation, route }: Props) {
  const { workoutLogId } = route.params;
  const [name, setName] = useState('');
  const [type, setType] = useState<ExerciseType>('reps_weight');
  const [skillId, setSkillId] = useState<string | null>(null);
  const { data: catalog } = useSkillCatalogQuery();

  const handleContinue = () => {
    if (!name.trim()) {
      Alert.alert('Nom manquant', "Donne un nom à l'exercice.");
      return;
    }
    navigation.navigate('SetForm', {
      workoutLogId,
      sessionExerciseId: null,
      exerciseName: name.trim(),
      type,
      skillKey: null,
      skillId,
    });
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pt-6" keyboardShouldPersistTaps="handled">
      <TextField label="Nom de l'exercice" value={name} onChangeText={setName} placeholder="Ex. Dips lestés" />

      <Text className="mb-1.5 font-bodyMedium text-sm text-textMuted">Type</Text>
      <View className="mb-4 gap-2">
        {EXERCISE_TYPES.map((option) => (
          <Pressable
            key={option}
            onPress={() => setType(option)}
            className={`border-2 px-4 py-3 ${
              type === option ? 'border-primary bg-primaryMuted' : 'border-border bg-surface'
            }`}
          >
            <Text className={type === option ? 'font-bodyMedium text-text' : 'font-body text-textMuted'}>
              {EXERCISE_TYPE_LABELS[option]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-1.5 font-bodyMedium text-sm text-textMuted">Rattacher à un skill suivi (optionnel)</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setSkillId(null)}
          className={`border-2 px-4 py-2 ${
            skillId === null ? 'border-primary bg-primaryMuted' : 'border-border bg-surface'
          }`}
        >
          <Text className={skillId === null ? 'font-bodyMedium text-text' : 'font-body text-textMuted'}>Aucun</Text>
        </Pressable>
        {(catalog ?? []).map((skill) => (
          <Pressable
            key={skill.id}
            onPress={() => setSkillId(skill.id)}
            className={`border-2 px-4 py-2 ${
              skillId === skill.id ? 'border-primary bg-primaryMuted' : 'border-border bg-surface'
            }`}
          >
            <Text className={skillId === skill.id ? 'font-bodyMedium text-text' : 'font-body text-textMuted'}>{skill.name}</Text>
          </Pressable>
        ))}
      </View>

      <Button label="Continuer" onPress={handleContinue} />
    </ScrollView>
  );
}
