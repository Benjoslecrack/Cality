import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useCreateProgram, useUpdateProgram } from '../../hooks/usePrograms';
import { promptForNotificationPermissionIfRelevant } from '../../lib/notifications';
import type { ProgramsStackParamList } from '../../navigation/ProgramsStack';

type Props = NativeStackScreenProps<ProgramsStackParamList, 'ProgramForm'>;

export function ProgramFormScreen({ navigation, route }: Props) {
  const { programId, initialName, initialDescription } = route.params;
  const isEditing = !!programId;

  const [name, setName] = useState(initialName ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const isSaving = createProgram.isPending || updateProgram.isPending;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nom manquant', 'Donne un nom à ton programme.');
      return;
    }
    try {
      if (isEditing) {
        await updateProgram.mutateAsync({ id: programId, name: name.trim(), description: description.trim() || null });
      } else {
        await createProgram.mutateAsync({ name: name.trim(), description: description.trim() || null });
        // Moment pertinent pour proposer les notifications : la valeur d'un
        // rappel de séance devient évidente dès qu'on a un premier programme.
        promptForNotificationPermissionIfRelevant();
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pt-6" keyboardShouldPersistTaps="handled">
        <TextField
          label="Nom du programme"
          value={name}
          onChangeText={setName}
          placeholder="Ex. Prise de masse - 4 jours"
        />
        <TextField
          label="Description (optionnel)"
          value={description}
          onChangeText={setDescription}
          placeholder="Objectif, contexte, notes..."
          multiline
          numberOfLines={3}
        />
        <Button label={isEditing ? 'Enregistrer' : 'Créer le programme'} onPress={handleSave} loading={isSaving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
