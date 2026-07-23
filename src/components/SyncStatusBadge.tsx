import { Text, View } from 'react-native';
import { useSyncStatus } from '../hooks/useSyncStatus';

// Discret : invisible tant que tout est synchronisé, n'apparaît que quand il
// y a quelque chose à signaler (actions en attente de réseau, ou conflit).
export function SyncStatusBadge() {
  const { status, pendingCount } = useSyncStatus();

  if (status === 'synced') return null;

  const isError = status === 'error';

  return (
    <View className="items-center">
      <View className={`rounded-full border px-3 py-1 ${isError ? 'border-accent bg-accentDim/40' : 'border-accentDim bg-surface'}`}>
        <Text className="font-bodyMedium text-xs text-text">
          {isError ? 'Erreur de synchronisation' : `En attente de sync${pendingCount > 1 ? ` (${pendingCount})` : ''}`}
        </Text>
      </View>
    </View>
  );
}
