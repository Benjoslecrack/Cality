import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { CalendarEntryWithSession } from '../hooks/useCalendarEntries';
import { useDeleteCalendarEntry, useUpdateCalendarEntryStatus } from '../hooks/useCalendarEntries';
import {
  useCreateWorkoutLog,
  useDeleteWorkoutLog,
  useWorkoutLogByCalendarEntryQuery,
} from '../hooks/useWorkoutLogs';
import { XPBar } from './XPBar';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import type { CalendarStatus } from '../types/database';

const STATUS_META: Record<CalendarStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string } | null> = {
  planned: null, // état par défaut, pas besoin de le signaler
  done: { label: 'Faite', icon: 'checkmark-circle', iconColor: COLORS.neonCyan },
  skipped: { label: 'Sautée', icon: 'play-skip-forward-circle-outline', iconColor: COLORS.sunsetOrange },
};

type Props = {
  entry: CalendarEntryWithSession;
  /** 'hero' : mise en avant sur l'écran Aujourd'hui (gros, un coup d'œil suffit). */
  size?: 'default' | 'hero';
};

export function CalendarEntryCard({ entry, size = 'default' }: Props) {
  // Typage volontairement large : ce composant est réutilisé dans plusieurs
  // stacks (Aujourd'hui, Calendrier) qui déclarent chacun l'écran WorkoutLog.
  const navigation = useNavigation<{ navigate: (screen: string, params?: object) => void }>();
  const updateStatus = useUpdateCalendarEntryStatus();
  const deleteEntry = useDeleteCalendarEntry();
  const deleteWorkoutLog = useDeleteWorkoutLog();
  const { createWorkoutLog } = useCreateWorkoutLog();
  const { data: existingLog } = useWorkoutLogByCalendarEntryQuery(entry.id);
  const statusMeta = STATUS_META[entry.status];
  const isHero = size === 'hero';

  const setStatus = (status: CalendarStatus) => updateStatus.mutate({ id: entry.id, status });

  const confirmDelete = () => {
    if (!existingLog) {
      Alert.alert('Retirer cette séance du calendrier ?', undefined, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: () => deleteEntry.mutate(entry.id) },
      ]);
      return;
    }
    // Une séance avec un log associé propose deux suppressions distinctes :
    // retirer juste l'assignation (garde l'historique/les skills) ou aussi
    // supprimer les vraies performances loggées (action volontaire séparée).
    Alert.alert('Retirer cette séance du calendrier ?', 'Un log existe pour cette séance.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer seulement (garder le log)', onPress: () => deleteEntry.mutate(entry.id) },
      {
        text: 'Supprimer aussi le log',
        style: 'destructive',
        onPress: () => {
          deleteWorkoutLog.mutate(existingLog.id);
          deleteEntry.mutate(entry.id);
        },
      },
    ]);
  };

  const handleLog = () => {
    if (existingLog) {
      navigation.navigate('WorkoutLog', { workoutLogId: existingLog.id });
      return;
    }
    const workoutLogId = createWorkoutLog({
      sessionName: entry.program_sessions?.name ?? 'Séance',
      performedDate: entry.scheduled_date,
      calendarEntryId: entry.id,
    });
    navigation.navigate('WorkoutLog', { workoutLogId });
  };

  return (
    <View
      style={CARD_SHADOW}
      className={`border-2 border-border bg-surface ${isHero ? 'p-6' : 'p-4'}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            className={`font-display text-text ${isHero ? 'text-3xl' : 'text-lg'}`}
            numberOfLines={2}
          >
            {entry.program_sessions?.name ?? 'Séance'}
          </Text>
          {entry.program_sessions?.programs?.name ? (
            <Text className="mt-1 font-body text-sm text-textMuted">{entry.program_sessions.programs.name}</Text>
          ) : null}
        </View>
        {statusMeta ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name={statusMeta.icon} size={18} color={statusMeta.iconColor} />
            <Text className="font-bodyMedium text-sm text-textMuted">{statusMeta.label}</Text>
          </View>
        ) : null}
      </View>

      {isHero ? <View className="my-4"><XPBar height={4} /></View> : null}

      <Pressable
        onPress={handleLog}
        className={`mt-4 min-h-11 items-center justify-center border-2 border-accentDim bg-accent ${isHero ? 'py-4' : 'py-2.5'}`}
      >
        <Text className={`font-bodySemibold text-onAccent ${isHero ? 'text-lg' : 'text-sm'}`}>
          {existingLog ? 'Voir le log' : 'Logger cette séance'}
        </Text>
      </Pressable>

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        {entry.status !== 'done' ? (
          <Pressable onPress={() => setStatus('done')} className="min-h-11 justify-center border-2 border-accent px-3">
            <Text className="font-bodyMedium text-sm text-text">Marquer fait</Text>
          </Pressable>
        ) : null}
        {entry.status !== 'skipped' ? (
          <Pressable onPress={() => setStatus('skipped')} className="min-h-11 justify-center border-2 border-accent px-3">
            <Text className="font-bodyMedium text-sm text-text">Marquer sauté</Text>
          </Pressable>
        ) : null}
        {entry.status !== 'planned' ? (
          <Pressable onPress={() => setStatus('planned')} className="min-h-11 justify-center rounded-lg px-3">
            <Text className="font-bodyMedium text-sm text-textMuted">Replanifier</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={confirmDelete} hitSlop={8} className="ml-auto h-11 w-11 items-center justify-center">
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}
