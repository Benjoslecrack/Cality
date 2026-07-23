import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import {
  DEFAULT_REST_SECONDS,
  useCreateSessionExercise,
  useDeleteSessionExercise,
  useUpdateSessionExercise,
} from '../../hooks/useSessionExercises';
import { EXERCISE_TYPE_LABELS } from '../../lib/exerciseFormat';
import { SKILLS } from '../../lib/skills';
import type { ProgramsStackParamList } from '../../navigation/ProgramsStack';
import type { ExerciseType, SkillKey } from '../../types/database';

type Props = NativeStackScreenProps<ProgramsStackParamList, 'ExerciseForm'>;

const EXERCISE_TYPES: ExerciseType[] = ['reps_weight', 'isometric', 'progression'];

export function ExerciseFormScreen({ navigation, route }: Props) {
  const { programSessionId, exerciseId, initialValues } = route.params;
  const isEditing = !!exerciseId;

  const [name, setName] = useState(initialValues?.name ?? '');
  const [type, setType] = useState<ExerciseType>(initialValues?.type ?? 'reps_weight');
  const [skillKey, setSkillKey] = useState<SkillKey | null>(initialValues?.skill_key ?? null);
  const [targetSets, setTargetSets] = useState(String(initialValues?.target_sets ?? 3));
  const [targetReps, setTargetReps] = useState(
    initialValues?.target_reps != null ? String(initialValues.target_reps) : ''
  );
  const [targetWeight, setTargetWeight] = useState(
    initialValues?.target_weight_kg != null ? String(initialValues.target_weight_kg) : ''
  );
  const [targetHold, setTargetHold] = useState(
    initialValues?.target_hold_seconds != null ? String(initialValues.target_hold_seconds) : ''
  );
  const [progressionVariant, setProgressionVariant] = useState(initialValues?.progression_variant ?? '');
  const [restSeconds, setRestSeconds] = useState(initialValues?.target_rest_seconds ?? DEFAULT_REST_SECONDS);
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const createExercise = useCreateSessionExercise(programSessionId);
  const updateExercise = useUpdateSessionExercise(programSessionId);
  const deleteExercise = useDeleteSessionExercise(programSessionId);
  const isSaving = createExercise.isPending || updateExercise.isPending;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nom manquant', "Donne un nom à l'exercice.");
      return;
    }
    const sets = parseInt(targetSets, 10);
    if (!sets || sets < 1) {
      Alert.alert('Séries invalides', 'Indique un nombre de séries valide.');
      return;
    }

    const input = {
      name: name.trim(),
      type,
      skill_key: skillKey,
      target_sets: sets,
      target_reps: type === 'reps_weight' && targetReps ? parseInt(targetReps, 10) : null,
      target_weight_kg: type === 'reps_weight' && targetWeight ? parseFloat(targetWeight) : null,
      target_hold_seconds: type === 'isometric' && targetHold ? parseInt(targetHold, 10) : null,
      target_rest_seconds: restSeconds,
      progression_variant: type === 'progression' ? progressionVariant.trim() || null : null,
      notes: notes.trim() || null,
    };

    try {
      if (isEditing) {
        await updateExercise.mutateAsync({ id: exerciseId, ...input });
      } else {
        await createExercise.mutateAsync(input);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer cet exercice ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteExercise.mutateAsync(exerciseId!);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pt-6 pb-12" keyboardShouldPersistTaps="handled">
        <TextField label="Nom de l'exercice" value={name} onChangeText={setName} placeholder="Ex. Développé couché" />

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

        <TextField
          label="Nombre de séries"
          value={targetSets}
          onChangeText={setTargetSets}
          keyboardType="number-pad"
          placeholder="3"
        />

        {type === 'reps_weight' ? (
          <>
            <TextField
              label="Répétitions par série"
              value={targetReps}
              onChangeText={setTargetReps}
              keyboardType="number-pad"
              placeholder="8"
            />
            <TextField
              label="Charge (kg, optionnel)"
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="decimal-pad"
              placeholder="60"
            />
          </>
        ) : null}

        {type === 'isometric' ? (
          <TextField
            label="Temps de maintien (secondes)"
            value={targetHold}
            onChangeText={setTargetHold}
            keyboardType="number-pad"
            placeholder="15"
          />
        ) : null}

        {type === 'progression' ? (
          <TextField
            label="Variante / niveau"
            value={progressionVariant}
            onChangeText={setProgressionVariant}
            placeholder="Ex. strict, kipping, tuck, straddle, full..."
          />
        ) : null}

        <Stepper
          label="Repos entre les séries"
          value={restSeconds}
          onChange={setRestSeconds}
          step={15}
          min={0}
          max={600}
          suffix="s"
        />

        <Text className="mb-1.5 mt-2 text-sm font-medium text-textMuted">
          Rattacher à un skill suivi (optionnel)
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
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
              <Text className={skillKey === skill.key ? 'font-medium text-text' : 'text-textMuted'}>
                {skill.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Notes (optionnel)"
          value={notes ?? ''}
          onChangeText={setNotes}
          placeholder="Consignes, tempo, remarques..."
          multiline
          numberOfLines={3}
        />

        <View className="mb-3">
          <Button label={isEditing ? 'Enregistrer' : "Ajouter l'exercice"} onPress={handleSave} loading={isSaving} />
        </View>
        {isEditing ? <Button label="Supprimer l'exercice" variant="secondary" onPress={handleDelete} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
