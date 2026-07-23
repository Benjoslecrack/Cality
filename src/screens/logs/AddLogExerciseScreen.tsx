import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { EXERCISE_TYPE_LABELS } from '../../lib/exerciseFormat';
import { SKILLS } from '../../lib/skills';
import type { ExerciseType, SkillKey } from '../../types/database';

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
        skillKey: SkillKey | null;
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
  const [skillKey, setSkillKey] = useState<SkillKey | null>(null);

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
      skillKey,
    });
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pt-6" keyboardShouldPersistTaps="handled">
      <TextField label="Nom de l'exercice" value={name} onChangeText={setName} placeholder="Ex. Dips lestés" />

      <Text className="mb-1.5 text-sm font-medium text-textMuted">Type</Text>
      <View className="mb-4 gap-2">
        {EXERCISE_TYPES.map((option) => (
          <Pressable
            key={option}
            onPress={() => setType(option)}
            className={`rounded-xl border px-4 py-3 ${
              type === option ? 'border-primary bg-primaryMuted' : 'border-border bg-surface'
            }`}
          >
            <Text className={type === option ? 'font-medium text-text' : 'text-textMuted'}>
              {EXERCISE_TYPE_LABELS[option]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-1.5 text-sm font-medium text-textMuted">Rattacher à un skill suivi (optionnel)</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setSkillKey(null)}
          className={`rounded-full border px-4 py-2 ${
            skillKey === null ? 'border-primary bg-primaryMuted' : 'border-border bg-surface'
          }`}
        >
          <Text className={skillKey === null ? 'font-medium text-text' : 'text-textMuted'}>Aucun</Text>
        </Pressable>
        {SKILLS.map((skill) => (
          <Pressable
            key={skill.key}
            onPress={() => setSkillKey(skill.key)}
            className={`rounded-full border px-4 py-2 ${
              skillKey === skill.key ? 'border-primary bg-primaryMuted' : 'border-border bg-surface'
            }`}
          >
            <Text className={skillKey === skill.key ? 'font-medium text-text' : 'text-textMuted'}>{skill.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button label="Continuer" onPress={handleContinue} />
    </ScrollView>
  );
}
