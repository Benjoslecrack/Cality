import NetInfo from '@react-native-community/netinfo';
import { MutationCache, onlineManager, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { Alert } from 'react-native';
import storage from './keyValueStore';

// Branche le détecteur réseau de React Query sur NetInfo : sans ça, React
// Native ne sait pas dire à la librairie si on est hors-ligne, et les
// mutations ne se mettraient jamais en pause automatiquement.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  });
});

// Une erreur Postgrest structurée (RLS, contrainte, ligne absente...) est un
// vrai conflit de données, pas un souci réseau : retenter ne changera rien,
// contrairement à une simple coupure de connexion.
export function isDataConflictError(error: unknown): error is { code: string; message: string } {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string';
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: (failureCount, error) => !isDataConflictError(error) && failureCount < 2,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isDataConflictError(error)) {
        Alert.alert(
          'Action ignorée',
          "Une modification n'a pas pu être appliquée : la donnée visée a changé ou n'existe plus entre-temps."
        );
      }
    },
  }),
});

export const queryCachePersister = createAsyncStoragePersister({
  storage,
  key: 'cality-query-cache',
  throttleTime: 1000,
});
