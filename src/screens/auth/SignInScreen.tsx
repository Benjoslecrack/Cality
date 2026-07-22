import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { signInWithPassword, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Champs manquants', 'Renseigne ton email et ton mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (error) {
      Alert.alert('Connexion impossible', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('Email manquant', 'Renseigne ton email pour recevoir un lien magique.');
      return;
    }
    setMagicLinkLoading(true);
    try {
      await signInWithMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch (error) {
      Alert.alert('Envoi impossible', (error as Error).message);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerClassName="flex-1 justify-center px-6" keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-3xl font-bold text-text">Cality</Text>
        <Text className="mb-8 text-base text-textMuted">Connecte-toi pour continuer ta progression.</Text>

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
          placeholder="••••••••"
        />

        <View className="mb-3">
          <Button label="Se connecter" onPress={handleSignIn} loading={loading} />
        </View>

        <View className="mb-6">
          <Button
            label={magicLinkSent ? 'Lien envoyé ✓' : 'Recevoir un lien magique'}
            onPress={handleMagicLink}
            variant="secondary"
            loading={magicLinkLoading}
            disabled={magicLinkSent}
          />
        </View>

        <Text className="text-center text-textMuted">
          Pas encore de compte ?{' '}
          <Text className="font-semibold text-primary" onPress={() => navigation.navigate('SignUp')}>
            Créer un compte
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
