import { useMutationState } from '@tanstack/react-query';

export type SyncStatus = 'synced' | 'pending' | 'error';

// Agrège l'état de toutes les mutations React Query en cours pour piloter le
// badge de synchronisation : une mutation "isPaused" = hors-ligne, en attente
// de reconnexion ; "error" = a échoué après reconnexion (conflit de donnée).
export function useSyncStatus(): { status: SyncStatus; pendingCount: number } {
  const mutations = useMutationState({
    select: (mutation) => ({ status: mutation.state.status, isPaused: mutation.state.isPaused }),
  });

  const pendingCount = mutations.filter((m) => m.isPaused || m.status === 'pending').length;
  const hasError = mutations.some((m) => m.status === 'error');

  let status: SyncStatus = 'synced';
  if (pendingCount > 0) status = 'pending';
  else if (hasError) status = 'error';

  return { status, pendingCount };
}
