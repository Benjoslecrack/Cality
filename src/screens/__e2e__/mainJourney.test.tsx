// Test d'intégration du parcours principal :
// connexion -> planifier une séance -> logger une séance -> voir la
// progression mise à jour.
//
// Un vrai test e2e sur device/simulateur (Detox, Maestro) n'est pas possible
// dans ce bac à sable (pas d'accès à un émulateur Android/iOS ni à Expo Go).
// Ce test reste honnête sur ce qu'il couvre : il fait tourner les VRAIS
// AuthContext + hooks React Query + logique métier (détection de PR, etc.)
// à travers un client Supabase factice en mémoire (src/testUtils/fakeSupabase),
// piloté via de vrais taps utilisateur (fireEvent.press) sur des écrans de
// test minimalistes. Seule la couche réseau Supabase est remplacée ; toute
// la logique d'intégration (contexts, hooks, invalidations React Query) est
// réelle.

import { useEffect, useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `workout_log_${++n}` };
});

jest.mock('../../lib/supabase', () => {
  const { createFakeSupabase } = require('../../testUtils/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase } from '../../lib/supabase';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { useCreateCalendarEntry, useTodayEntriesQuery } from '../../hooks/useCalendarEntries';
import { useCreateWorkoutLog } from '../../hooks/useWorkoutLogs';
import { useAddExerciseSet, useExerciseLogsQuery } from '../../hooks/useExerciseLogs';
import { todayDateKey } from '../../lib/dateUtils';

const fakeDb = (supabase as unknown as { _db: Record<string, any[]> })._db;

function JourneyHarness({ onSessionReady }: { onSessionReady: (userId: string) => void }) {
  const { session, signInWithPassword } = useAuth();
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ isNewRecord: boolean } | null>(null);

  const createEntry = useCreateCalendarEntry();
  const todayEntries = useTodayEntriesQuery();
  const { createWorkoutLog } = useCreateWorkoutLog();
  const addSet = useAddExerciseSet(workoutLogId ?? '');
  const progressHistory = useExerciseLogsQuery(workoutLogId ?? '');

  useEffect(() => {
    if (session) onSessionReady(session.user.id);
  }, [session, onSessionReady]);

  if (!session) {
    return (
      <Pressable onPress={() => signInWithPassword('athlete@cality.test', 'password123')}>
        <Text>Se connecter</Text>
      </Pressable>
    );
  }

  const plannedEntry = todayEntries.data?.[0];

  return (
    <View>
      <Text>connecte:{session.user.id}</Text>

      <Pressable onPress={() => createEntry.mutate({ programSessionId: 'ps_1', scheduledDate: todayDateKey() })}>
        <Text>Planifier</Text>
      </Pressable>
      <Text>entries:{todayEntries.data?.length ?? 0}</Text>
      {plannedEntry && <Text>seance:{plannedEntry.program_sessions?.name}</Text>}

      <Pressable
        onPress={() => {
          const id = createWorkoutLog({
            sessionName: plannedEntry?.program_sessions?.name ?? 'Séance libre',
            performedDate: todayDateKey(),
            calendarEntryId: plannedEntry?.id ?? null,
          });
          setWorkoutLogId(id);
        }}
      >
        <Text>Logger la séance</Text>
      </Pressable>
      <Text>workoutLog:{workoutLogId ?? 'aucun'}</Text>

      <Pressable
        onPress={async () => {
          const result = await addSet.mutateAsync({
            sessionExerciseId: null,
            exerciseName: 'Tractions',
            type: 'progression',
            skillKey: 'pull_up',
            skillId: null,
            reps: 12,
            weight_kg: null,
            hold_seconds: null,
            progression_variant: null,
          });
          setLastResult({ isNewRecord: result.isNewRecord });
        }}
      >
        <Text>Logger la série</Text>
      </Pressable>
      <Text>record:{lastResult ? String(lastResult.isNewRecord) : 'en_attente'}</Text>
      <Text>historique:{progressHistory.data?.length ?? 0}</Text>
    </View>
  );
}

test('parcours complet : connexion -> planifier -> logger -> progression mise à jour', async () => {
  // Programme + séance type pré-existants (comme un utilisateur qui aurait
  // déjà créé son programme lors d'une session précédente).
  fakeDb.programs = [{ id: 'prog_1', user_id: 'seed', name: 'Street Workout Base' }];
  fakeDb.program_sessions = [{ id: 'ps_1', program_id: 'prog_1', user_id: 'seed', name: 'Push Day', position: 1 }];

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let capturedUserId: string | null = null;

  const { getByText } = await render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <JourneyHarness onSessionReady={(id) => (capturedUserId = id)} />
      </AuthProvider>
    </QueryClientProvider>
  );

  // 1. Connexion.
  expect(getByText('Se connecter')).toBeTruthy();
  fireEvent.press(getByText('Se connecter'));
  await waitFor(() => expect(capturedUserId).not.toBeNull());

  // Un record précédent de 8 tractions, pour vérifier que 12 est bien détecté
  // comme un nouveau record (et pas seulement "une série de plus").
  fakeDb.exercise_logs = [
    { id: 'prior_1', user_id: capturedUserId!, exercise_name: 'Tractions', reps: 8, weight_kg: null, hold_seconds: null },
  ];

  // 2. Planifier la séance du jour.
  fireEvent.press(getByText('Planifier'));
  await waitFor(() => expect(getByText('entries:1')).toBeTruthy());
  expect(getByText('seance:Push Day')).toBeTruthy();

  // 3. Logger la séance (créée à partir de la séance planifiée).
  fireEvent.press(getByText('Logger la séance'));
  await waitFor(() => expect(getByText('workoutLog:workout_log_1')).toBeTruthy());

  // 4. Logger une série avec un nouveau record, et voir la progression mise à jour.
  fireEvent.press(getByText('Logger la série'));
  await waitFor(() => expect(getByText('record:true')).toBeTruthy());
  await waitFor(() => expect(getByText('historique:1')).toBeTruthy());

  // La séance et la série sont bien rattachées au même utilisateur, et
  // persistées dans le client Supabase factice (comme elles le seraient en base).
  expect(fakeDb.workout_logs.find((w: any) => w.id === 'workout_log_1')?.user_id).toBe(capturedUserId);
  expect(fakeDb.exercise_logs.find((e: any) => e.reps === 12)?.user_id).toBe(capturedUserId);
});
