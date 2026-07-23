import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useAddExerciseSet, useUpdateExerciseSet, useDeleteExerciseSet } from '../../hooks/useExerciseLogs';
import type { ExerciseType, SkillKey } from '../../types/database';

export type SetFormParams = {
  workoutLogId: string;
  sessionExerciseId: string | null;
  exerciseName: string;
  type: ExerciseType;
  skillKey: SkillKey | null;
  setId?: string;
  initialValues?: {
    reps: number | null;
    weight_kg: number | null;
    hold_seconds: number | null;
    progression_variant: string | null;
  };
};

type Props = {
  route: { params: SetFormParams };
  navigation: { goBack: () => void };
};

export function SetFormScreen({ navigation, route }: Props) {
  const { workoutLogId, sessionExerciseId, exerciseName, type, skillKey, setId, initialValues } = route.params;
  const isEditing = !!setId;

  const [reps, setReps] = useState(initialValues?.reps != null ? String(initialValues.reps) : '');
  const [weight, setWeight] = useState(initialValues?.weight_kg != null ? String(initialValues.weight_kg) : '');
  const [hold, setHold] = useState(initialValues?.hold_seconds != null ? String(initialValues.hold_seconds) : '');
  const [variant, setVariant] = useState(initialValues?.progression_variant ?? '');

  const addSet = useAddExerciseSet(workoutLogId);
  const updateSet = useUpdateExerciseSet(workoutLogId);
  const deleteSet = useDeleteExerciseSet(workoutLogId);
  const isSaving = addSet.isPending || updateSet.isPending;

  const handleSave = async () => {
    const values = {
      reps: type !== 'isometric' && reps ? parseInt(reps, 10) : null,
      weight_kg: type === 'reps_weight' && weight ? parseFloat(weight) : null,
      hold_seconds: type === 'isometric' && hold ? parseInt(hold, 10) : null,
      progression_variant: type === 'progression' ? variant.trim() || null : null,
    };

    try {
      if (isEditing) {
        await updateSet.mutateAsync({ id: setId, ...values });
      } else {
        await addSet.mutateAsync({
          sessionExerciseId,
          exerciseName,
          type,
          skillKey,
          ...values,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer cette série ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteSet.mutateAsync(setId!);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pt-6" keyboardShouldPersistTaps="handled">
        <Text className="mb-4 text-lg font-semibold text-text">{exerciseName}</Text>

        {type === 'reps_weight' ? (
          <>
            <TextField label="Répétitions" value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="8" />
            <TextField
              label="Charge (kg, optionnel)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="60"
            />
          </>
        ) : null}

        {type === 'isometric' ? (
          <TextField
            label="Temps de maintien (secondes)"
            value={hold}
            onChangeText={setHold}
            keyboardType="number-pad"
            placeholder="15"
          />
        ) : null}

        {type === 'progression' ? (
          <>
            <TextField
              label="Variante réalisée"
              value={variant}
              onChangeText={setVariant}
              placeholder="Ex. strict, kipping, tuck..."
            />
            <TextField
              label="Répétitions (optionnel)"
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholder="1"
            />
          </>
        ) : null}

        <View className="mb-3">
          <Button
            label={isEditing ? 'Enregistrer' : 'Ajouter la série'}
            onPress={handleSave}
            loading={isSaving}
          />
        </View>
        {isEditing ? (
          <Button label="Supprimer la série" variant="secondary" onPress={handleDelete} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
