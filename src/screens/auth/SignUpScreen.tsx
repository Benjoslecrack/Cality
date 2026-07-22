import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUpWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Champs manquants', 'Renseigne ton email et un mot de passe.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Il doit faire au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Les mots de passe ne correspondent pas', 'Vérifie la confirmation.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithPassword(email.trim(), password);
      Alert.alert(
        'Compte créé',
        'Vérifie ta boîte mail pour confirmer ton inscription si la confirmation est activée sur le projet Supabase.'
      );
    } catch (error) {
      Alert.alert('Inscription impossible', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerClassName="flex-1 justify-center px-6" keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-3xl font-bold text-text">Créer un compte</Text>
        <Text className="mb-8 text-base text-textMuted">
          Rejoins Cality pour suivre ta progression en street workout.
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="toi@exemple.com"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Au moins 6 caractères"
        />
        <TextField
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Text
          className="mb-6 text-center text-textMuted"
          onPress={() => navigation.navigate('SignIn')}
        >
          Déjà un compte ? <Text className="font-semibold text-primary">Se connecter</Text>
        </Text>

        <Button label="Créer mon compte" onPress={handleSignUp} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
