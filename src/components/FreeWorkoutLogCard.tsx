import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDeleteWorkoutLog } from '../hooks/useWorkoutLogs';
import type { Database } from '../types/database';

type WorkoutLogRow = Database['public']['Tables']['workout_logs']['Row'];

export function FreeWorkoutLogCard({ log }: { log: WorkoutLogRow }) {
  // Typage volontairement large : réutilisé dans plusieurs stacks (Aujourd'hui, Calendrier).
  const navigation = useNavigation<{ navigate: (screen: string, params?: object) => void }>();
  const deleteLog = useDeleteWorkoutLog();

  const confirmDelete = () => {
    Alert.alert('Supprimer ce log ?', 'Les séries loggées seront définitivement supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteLog.mutate(log.id) },
    ]);
  };

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-semibold text-text">{log.session_name}</Text>
        <View className="rounded-full border border-border bg-surfaceAlt px-2.5 py-0.5">
          <Text className="text-xs font-medium text-textMuted">Libre</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Pressable
          onPress={() => navigation.navigate('WorkoutLog', { workoutLogId: log.id })}
          className="rounded-lg bg-primary px-3 py-1.5"
        >
          <Text className="text-sm font-semibold text-white">Voir le log</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} hitSlop={8} className="ml-auto">
          <Ionicons name="trash-outline" size={18} color="#9AA1AA" />
        </Pressable>
      </View>
    </View>
  );
}
