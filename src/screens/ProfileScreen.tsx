import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useExportLogsCsv, useExportProgressPdf } from '../hooks/useDataExport';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import type { MainTabParamList } from '../navigation/MainTabs';
import { COLORS } from '../theme/tokens';

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="flex-1 pr-3 font-body text-base text-text">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.bgNight, true: COLORS.accentDim }}
        thumbColor={value ? COLORS.neonMagenta : COLORS.textMuted}
      />
    </View>
  );
}

function TimePresetButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button label={label} variant={active ? 'primary' : 'secondary'} onPress={onPress} />
  );
}

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const exportCsv = useExportLogsCsv();
  const exportPdf = useExportProgressPdf();

  const permission = useNotificationPermission();
  const [username, setUsername] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      <Text className="mb-1 font-displayBold text-3xl text-text">Profil</Text>
      <Text className="mb-8 font-body text-textMuted">{session?.user.email}</Text>

      <TextField label="Pseudo" value={username} onChangeText={setUsername} placeholder="Ton pseudo" />

      <View className="mb-8">
        <Button
          label="Enregistrer"
          onPress={handleSave}
          loading={updateProfile.isPending}
          disabled={!hasChanges}
        />
      </View>

      <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Skills</Text>
      <View className="mb-8">
        <Button
          label="Sélectionner mes skills actifs"
          variant="secondary"
          onPress={() => navigation.navigate('Skills', { screen: 'SkillSelection' })}
        />
      </View>

      <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Notifications</Text>
      <View className="mb-8 gap-4">
        {permission.status === 'unsupported' ? (
          <Text className="font-body text-xs text-textMuted">
            Indisponible dans Expo Go — nécessite un build de développement (eas build).
          </Text>
        ) : permission.status === 'denied' ? (
          <Text className="font-body text-xs text-textMuted">
            Permission refusée. Active-la dans les réglages du téléphone pour recevoir des
            notifications.
          </Text>
        ) : permission.status === 'undetermined' ? (
          <Button label="Activer les notifications" variant="secondary" onPress={() => permission.request()} />
        ) : null}

        {profile ? (
          <>
            <ToggleRow
              label="Rappel de séance planifiée"
              value={profile.notify_session_reminder}
              onChange={(value) => updateProfile.mutate({ notify_session_reminder: value })}
            />
            <ToggleRow
              label="Streak en danger"
              value={profile.notify_streak}
              onChange={(value) => updateProfile.mutate({ notify_streak: value })}
            />
            <ToggleRow
              label="Palier débloqué / record"
              value={profile.notify_milestone}
              onChange={(value) => updateProfile.mutate({ notify_milestone: value })}
            />

            {profile.notify_session_reminder ? (
              <View>
                <Text className="mb-1.5 font-bodyMedium text-sm text-textMuted">Heure du rappel</Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <TimePresetButton
                      label="9h"
                      active={profile.session_reminder_hour === 9 && profile.session_reminder_minute === 0}
                      onPress={() => updateProfile.mutate({ session_reminder_hour: 9, session_reminder_minute: 0 })}
                    />
                  </View>
                  <View className="flex-1">
                    <TimePresetButton
                      label="18h"
                      active={profile.session_reminder_hour === 18 && profile.session_reminder_minute === 0}
                      onPress={() => updateProfile.mutate({ session_reminder_hour: 18, session_reminder_minute: 0 })}
                    />
                  </View>
                  <View className="flex-1">
                    <TimePresetButton
                      label={`${String(profile.session_reminder_hour).padStart(2, '0')}h${String(
                        profile.session_reminder_minute
                      ).padStart(2, '0')}`}
                      active={
                        !((profile.session_reminder_hour === 9 || profile.session_reminder_hour === 18) &&
                          profile.session_reminder_minute === 0)
                      }
                      onPress={() => setShowTimePicker(true)}
                    />
                  </View>
                </View>
                {showTimePicker ? (
                  <DateTimePicker
                    value={(() => {
                      const d = new Date();
                      d.setHours(profile.session_reminder_hour, profile.session_reminder_minute, 0, 0);
                      return d;
                    })()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selected) => {
                      setShowTimePicker(false);
                      if (event.type === 'set' && selected) {
                        updateProfile.mutate({
                          session_reminder_hour: selected.getHours(),
                          session_reminder_minute: selected.getMinutes(),
                        });
                      }
                    }}
                  />
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Mes données</Text>
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
