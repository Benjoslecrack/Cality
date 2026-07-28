import { useCallback, useEffect, useState } from 'react';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '../lib/notifications';

// Statut de permission réactif, pour l'écran de réglages (affichage +
// bouton "Activer"). Pas de contexte global : un seul écran en a besoin
// aujourd'hui, cf. discussion sur le pattern de contexte dans ce projet.
export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermissionStatus | null>(null);

  const refresh = useCallback(() => {
    getNotificationPermissionStatus().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const request = useCallback(async () => {
    const granted = await requestNotificationPermission();
    refresh();
    return granted;
  }, [refresh]);

  return { status, refresh, request };
}
