import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useExportLogsCsv, useExportProgressPdf } from '../hooks/useDataExport';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { SKILLS } from '../lib/skills';
import type { SkillKey } from '../types/database';

export function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const exportCsv = useExportLogsCsv();
  const exportPdf = useExportProgressPdf();

  const [username, setUsername] = useState('');
  const [goals, setGoals] = useState<SkillKey[]>([]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setGoals(profile.goals ?? []);
    }
  }, [profile]);

  const toggleGoal = (key: SkillKey) => {
    setGoals((current) =>
      current.includes(key) ? current.filter((goal) => goal !== key) : [...current, key]
    );
  };

  const hasChanges =
    profile && (username !== (profile.username ?? '') || JSON.stringify(goals) !== JSON.stringify(profile.goals ?? []));

  const handleSave = () => {
    updateProfile.mutate(
      { username: username.trim(), goals },
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
        <ActivityIndicator color="#F2545B" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-16">
      <Text className="mb-1 text-3xl font-bold text-text">Profil</Text>
      <Text className="mb-8 text-textMuted">{session?.user.email}</Text>

      <TextField label="Pseudo" value={username} onChangeText={setUsername} placeholder="Ton pseudo" />

      <Text className="mb-3 mt-2 text-sm font-medium text-textMuted">Objectifs actuels</Text>
      <View className="mb-8 flex-row flex-wrap gap-2">
        {SKILLS.map((skill) => {
          const selected = goals.includes(skill.key);
          return (
            <Pressable
              key={skill.key}
              onPress={() => toggleGoal(skill.key)}
              className={`rounded-full border px-4 py-2 ${
                selected ? 'border-primary bg-primaryMuted' : 'border-border bg-surface'
              }`}
            >
              <Text className={selected ? 'font-medium text-text' : 'text-textMuted'}>{skill.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mb-8">
        <Button
          label="Enregistrer"
          onPress={handleSave}
          loading={updateProfile.isPending}
          disabled={!hasChanges}
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
