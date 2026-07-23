import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useCreateProgramSession, useUpdateProgramSession } from '../../hooks/useProgramSessions';
import type { ProgramsStackParamList } from '../../navigation/ProgramsStack';

type Props = NativeStackScreenProps<ProgramsStackParamList, 'SessionForm'>;

export function SessionFormScreen({ navigation, route }: Props) {
  const { programId, sessionId, initialName } = route.params;
  const isEditing = !!sessionId;

  const [name, setName] = useState(initialName ?? '');

  const createSession = useCreateProgramSession(programId);
  const updateSession = useUpdateProgramSession(programId);
  const isSaving = createSession.isPending || updateSession.isPending;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nom manquant', 'Donne un nom à cette séance (ex. Push, Pull, Legs, Skills).');
      return;
    }
    try {
      if (isEditing) {
        await updateSession.mutateAsync({ id: sessionId, name: name.trim() });
      } else {
        await createSession.mutateAsync(name.trim());
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pt-6" keyboardShouldPersistTaps="handled">
        <TextField label="Nom de la séance" value={name} onChangeText={setName} placeholder="Ex. Push" />
        <Button label={isEditing ? 'Enregistrer' : 'Ajouter la séance'} onPress={handleSave} loading={isSaving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
