import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CalendarEntryWithSession } from '../hooks/useCalendarEntries';
import { useDeleteCalendarEntry, useUpdateCalendarEntryStatus } from '../hooks/useCalendarEntries';
import type { CalendarStatus } from '../types/database';

const STATUS_STYLES: Record<CalendarStatus, { label: string; badgeClass: string; textClass: string }> = {
  planned: { label: 'Prévue', badgeClass: 'bg-surfaceAlt border-border', textClass: 'text-textMuted' },
  done: { label: 'Faite', badgeClass: 'bg-success/20 border-success', textClass: 'text-success' },
  skipped: { label: 'Sautée', badgeClass: 'bg-warning/20 border-warning', textClass: 'text-warning' },
};

export function CalendarEntryCard({ entry }: { entry: CalendarEntryWithSession }) {
  const updateStatus = useUpdateCalendarEntryStatus();
  const deleteEntry = useDeleteCalendarEntry();
  const statusStyle = STATUS_STYLES[entry.status];

  const setStatus = (status: CalendarStatus) => updateStatus.mutate({ id: entry.id, status });

  const confirmDelete = () => {
    Alert.alert('Retirer cette séance du calendrier ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => deleteEntry.mutate(entry.id) },
    ]);
  };

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-base font-semibold text-text">{entry.program_sessions?.name ?? 'Séance'}</Text>
          {entry.program_sessions?.programs?.name ? (
            <Text className="mt-0.5 text-sm text-textMuted">{entry.program_sessions.programs.name}</Text>
          ) : null}
        </View>
        <View className={`rounded-full border px-2.5 py-0.5 ${statusStyle.badgeClass}`}>
          <Text className={`text-xs font-medium ${statusStyle.textClass}`}>{statusStyle.label}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        {entry.status !== 'done' ? (
          <Pressable onPress={() => setStatus('done')} className="rounded-lg border border-success px-3 py-1.5">
            <Text className="text-sm font-medium text-success">Marquer fait</Text>
          </Pressable>
        ) : null}
        {entry.status !== 'skipped' ? (
          <Pressable onPress={() => setStatus('skipped')} className="rounded-lg border border-warning px-3 py-1.5">
            <Text className="text-sm font-medium text-warning">Marquer sauté</Text>
          </Pressable>
        ) : null}
        {entry.status !== 'planned' ? (
          <Pressable onPress={() => setStatus('planned')} className="rounded-lg border border-border px-3 py-1.5">
            <Text className="text-sm text-textMuted">Replanifier</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={confirmDelete} hitSlop={8} className="ml-auto">
          <Ionicons name="trash-outline" size={18} color="#9AA1AA" />
        </Pressable>
      </View>
    </View>
  );
}
