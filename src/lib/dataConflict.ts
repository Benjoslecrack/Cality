// Isolé de queryClient.ts pour rester testable sans tirer NetInfo/Alert/RN.

// Une erreur Postgrest structurée (RLS, contrainte, ligne absente...) est un
// vrai conflit de données, pas un souci réseau : retenter ne changera rien,
// contrairement à une simple coupure de connexion.
export function isDataConflictError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

// Politique de retry des mutations : une coupure réseau mérite une ou deux
// tentatives (le temps que la connexion revienne), un vrai conflit de donnée
// non — retenter ne changera pas le résultat.
export function shouldRetryMutation(failureCount: number, error: unknown): boolean {
  return !isDataConflictError(error) && failureCount < 2;
}
