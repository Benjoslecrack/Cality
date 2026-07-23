import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useExportLogsCsv, useExportProgressPdf } from '../hooks/useDataExport';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import type { MainTabParamList } from '../navigation/MainTabs';
import { COLORS } from '../theme/tokens';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const exportCsv = useExportLogsCsv();
  const exportPdf = useExportProgressPdf();

  const [username, setUsername] = useState('');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
    }
  }, [profile]);

  const hasChanges = profile && username !== (profile.username ?? '');

  const handleSave = () => {
    updateProfile.mutate(
      { username: username.trim() },
      {
        onError: (error) => Alert.alert('Erreur', (error as Error).message),
      }
    );
  };

  const handleExportCsv = () => {
    exportCsv.mutate(undefined, {
      onError: (error) => Alert.alert('Erreur', (error as Error).message),
    });
  };

  const handleExportPdf = () => {
    exportPdf.mutate(undefined, {
      onError: (error) => Alert.alert('Erreur', (error as Error).message),
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-16">
      <Text className="mb-1 text-3xl font-bold text-text">Profil</Text>
      <Text className="mb-8 text-textMuted">{session?.user.email}</Text>

      <TextField label="Pseudo" value={username} onChangeText={setUsername} placeholder="Ton pseudo" />

      <View className="mb-8">
        <Button
          label="Enregistrer"
          onPress={handleSave}
          loading={updateProfile.isPending}
          disabled={!hasChanges}
        />
      </View>

      <Text className="mb-3 text-sm font-medium text-textMuted">Skills</Text>
      <View className="mb-8">
        <Button
          label="Sélectionner mes skills actifs"
          variant="secondary"
          onPress={() => navigation.navigate('Skills', { screen: 'SkillSelection' })}
        />
      </View>

      <Text className="mb-3 text-sm font-medium text-textMuted">Mes données</Text>
      <View className="mb-8 gap-3">
        <Button
          label="Exporter mon historique (CSV)"
          variant="secondary"
          onPress={handleExportCsv}
          loading={exportCsv.isPending}
        />
        <Button
          label="Exporter ma progression (PDF)"
          variant="secondary"
          onPress={handleExportPdf}
          loading={exportPdf.isPending}
        />
      </View>

      <Button label="Se déconnecter" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}
