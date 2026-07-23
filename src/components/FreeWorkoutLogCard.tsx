import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDeleteWorkoutLog } from '../hooks/useWorkoutLogs';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import type { Database } from '../types/database';

type WorkoutLogRow = Database['public']['Tables']['workout_logs']['Row'];

type Props = {
  log: WorkoutLogRow;
  size?: 'default' | 'hero';
};

export function FreeWorkoutLogCard({ log, size = 'default' }: Props) {
  // Typage volontairement large : réutilisé dans plusieurs stacks (Aujourd'hui, Calendrier).
  const navigation = useNavigation<{ navigate: (screen: string, params?: object) => void }>();
  const deleteLog = useDeleteWorkoutLog();
  const isHero = size === 'hero';

  const confirmDelete = () => {
    Alert.alert('Supprimer ce log ?', 'Les séries loggées seront définitivement supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteLog.mutate(log.id) },
    ]);
  };

  return (
    <View style={CARD_SHADOW} className={`rounded-2xl bg-surface ${isHero ? 'p-6' : 'p-4'}`}>
      <View className="flex-row items-start justify-between">
        <Text className={`flex-1 pr-3 font-display text-text ${isHero ? 'text-3xl' : 'text-lg'}`} numberOfLines={2}>
          {log.session_name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="footsteps-outline" size={16} color={COLORS.textMuted} />
          <Text className="font-bodyMedium text-sm text-textMuted">Libre</Text>
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('WorkoutLog', { workoutLogId: log.id })}
        className={`mt-4 min-h-11 items-center justify-center rounded-xl bg-accent ${isHero ? 'py-4' : 'py-2.5'}`}
      >
        <Text className={`font-bodySemibold text-onAccent ${isHero ? 'text-lg' : 'text-sm'}`}>Voir le log</Text>
      </Pressable>

      <Pressable onPress={confirmDelete} hitSlop={8} className="mt-3 h-11 w-11 items-center justify-center self-end">
        <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
      </Pressable>
    </View>
  );
}
