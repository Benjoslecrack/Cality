// Vérifie que les policies RLS empêchent bien un utilisateur de lire/modifier
// les données d'un autre. Crée deux comptes de test jetables (via la clé
// service_role, qui contourne RLS), insère des données comme le premier,
// puis vérifie que le second n'y a aucun accès. Nettoie tout à la fin.
//
// Usage :
//   SUPABASE_SERVICE_ROLE_KEY=... node --env-file=.env scripts/test-rls.mjs
//
// La clé service_role se trouve dans Project Settings > API sur supabase.com.
// NE JAMAIS la mettre dans .env (celui de l'app) ni la préfixer EXPO_PUBLIC_ :
// elle contourne RLS et ne doit jamais finir dans le bundle client. Passe-la
// uniquement en variable d'environnement pour cette commande ponctuelle.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    'Variables manquantes. Attendu : EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY (déjà dans .env) ' +
      'et SUPABASE_SERVICE_ROLE_KEY (à passer séparément, jamais dans .env).'
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function check(label, passed, detail) {
  results.push({ label, passed, detail });
  console.log(`${passed ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function createTestUser(tag) {
  const email = `rls-test-${tag}-${Date.now()}@example.com`;
  const password = 'Test-Password-1234!';
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`Création utilisateur ${tag} : ${error.message}`);

  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Connexion utilisateur ${tag} : ${signInError.message}`);

  return { userId: data.user.id, client };
}

async function main() {
  console.log('Création de deux comptes de test...');
  const userA = await createTestUser('a');
  const userB = await createTestUser('b');

  try {
    console.log("\nInsertion de données comme l'utilisateur A...");
    const { data: program, error: programError } = await userA.client
      .from('programs')
      .insert({ user_id: userA.userId, name: 'Programme privé A' })
      .select()
      .single();
    if (programError) throw new Error(`Insertion program (A) : ${programError.message}`);

    const { data: programSession, error: sessionError } = await userA.client
      .from('program_sessions')
      .insert({ program_id: program.id, user_id: userA.userId, name: 'Séance privée A', position: 0 })
      .select()
      .single();
    if (sessionError) throw new Error(`Insertion program_session (A) : ${sessionError.message}`);

    const { data: sessionExercise, error: exerciseError } = await userA.client
      .from('session_exercises')
      .insert({
        program_session_id: programSession.id,
        user_id: userA.userId,
        name: 'Exercice privé A',
        type: 'reps_weight',
        target_sets: 3,
      })
      .select()
      .single();
    if (exerciseError) throw new Error(`Insertion session_exercise (A) : ${exerciseError.message}`);

    const { data: calendarEntry, error: calendarError } = await userA.client
      .from('calendar_entries')
      .insert({
        user_id: userA.userId,
        program_session_id: programSession.id,
        scheduled_date: '2026-01-01',
      })
      .select()
      .single();
    if (calendarError) throw new Error(`Insertion calendar_entry (A) : ${calendarError.message}`);

    const { data: workoutLog, error: workoutLogError } = await userA.client
      .from('workout_logs')
      .insert({
        user_id: userA.userId,
        calendar_entry_id: calendarEntry.id,
        session_name: 'Séance privée A',
        performed_date: '2026-01-01',
      })
      .select()
      .single();
    if (workoutLogError) throw new Error(`Insertion workout_log (A) : ${workoutLogError.message}`);

    const { data: exerciseLog, error: exerciseLogError } = await userA.client
      .from('exercise_logs')
      .insert({
        workout_log_id: workoutLog.id,
        user_id: userA.userId,
        session_exercise_id: sessionExercise.id,
        exercise_name: 'Exercice privé A',
        type: 'reps_weight',
        set_number: 1,
        reps: 8,
        weight_kg: 50,
      })
      .select()
      .single();
    if (exerciseLogError) throw new Error(`Insertion exercise_log (A) : ${exerciseLogError.message}`);

    console.log("\nVérification que l'utilisateur B ne peut PAS lire les données de A...");
    const tablesAndIds = [
      ['profiles', 'id', userA.userId],
      ['programs', 'id', program.id],
      ['program_sessions', 'id', programSession.id],
      ['session_exercises', 'id', sessionExercise.id],
      ['calendar_entries', 'id', calendarEntry.id],
      ['workout_logs', 'id', workoutLog.id],
      ['exercise_logs', 'id', exerciseLog.id],
    ];

    for (const [table, idColumn, id] of tablesAndIds) {
      const { data, error } = await userB.client.from(table).select('*').eq(idColumn, id);
      check(`SELECT ${table} (B lit une ligne de A)`, !error && data.length === 0, error ? error.message : `${data.length} ligne(s) visible(s)`);
    }

    console.log("\nVérification que l'utilisateur B ne peut PAS modifier/supprimer les données de A...");
    const { data: updateData } = await userB.client
      .from('programs')
      .update({ name: 'Modifié par B' })
      .eq('id', program.id)
      .select();
    check('UPDATE programs (B modifie une ligne de A)', (updateData ?? []).length === 0, `${(updateData ?? []).length} ligne(s) modifiée(s)`);

    const { data: deleteData } = await userB.client.from('exercise_logs').delete().eq('id', exerciseLog.id).select();
    check('DELETE exercise_logs (B supprime une ligne de A)', (deleteData ?? []).length === 0, `${(deleteData ?? []).length} ligne(s) supprimée(s)`);

    console.log("\nVérification que l'utilisateur A voit bien ses propres données...");
    const { data: ownData, error: ownError } = await userA.client.from('programs').select('*').eq('id', program.id);
    check('SELECT programs (A lit sa propre ligne)', !ownError && ownData.length === 1, ownError?.message);
  } finally {
    console.log('\nNettoyage des comptes de test...');
    await admin.auth.admin.deleteUser(userA.userId);
    await admin.auth.admin.deleteUser(userB.userId);
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${results.length - failed.length}/${results.length} vérifications passées.`);
  if (failed.length > 0) {
    console.error('Des policies RLS semblent manquantes ou incorrectes.');
    process.exit(1);
  }
  console.log('RLS OK : un utilisateur ne peut ni lire ni modifier les données d\'un autre.');
}

main().catch((error) => {
  console.error('\nÉchec du script :', error.message);
  process.exit(1);
});
