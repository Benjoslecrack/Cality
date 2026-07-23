// Vérifie que les policies RLS empêchent bien un utilisateur de lire/modifier
// les données d'un autre — sur les tables Postgres ET sur le bucket Storage
// "progress-photos" (privé, un dossier par utilisateur). Crée deux comptes de
// test jetables (via la clé service_role, qui contourne RLS), insère des
// données comme le premier, puis vérifie que le second n'y a aucun accès.
// Nettoie tout à la fin.
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

    console.log('\nUpload d\'une photo de progression comme A (Storage)...');
    const photoBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]); // JPEG minimal (SOI+EOI), suffisant pour un test
    const storagePath = `${userA.userId}/rls-test.jpg`;
    const { error: uploadError } = await userA.client.storage
      .from('progress-photos')
      .upload(storagePath, photoBytes, { contentType: 'image/jpeg' });
    if (uploadError) throw new Error(`Upload Storage (A) : ${uploadError.message}`);

    const { data: progressPhoto, error: photoError } = await userA.client
      .from('progress_photos')
      .insert({ user_id: userA.userId, taken_date: '2026-01-01', storage_path: storagePath })
      .select()
      .single();
    if (photoError) throw new Error(`Insertion progress_photo (A) : ${photoError.message}`);

    console.log('\nVérification du catalogue de skills (référentiel partagé, lecture ouverte)...');
    const { data: pullUpSkill, error: skillError } = await admin.from('skills').select('id').eq('key', 'pull_up').single();
    if (skillError) throw new Error(`Lecture skills (admin) : ${skillError.message}`);
    const { data: ironTier, error: tierError } = await admin
      .from('skill_tiers')
      .select('id')
      .eq('skill_id', pullUpSkill.id)
      .eq('rank', 'iron')
      .single();
    if (tierError) throw new Error(`Lecture skill_tiers (admin) : ${tierError.message}`);
    const { data: bronzeTier, error: bronzeTierError } = await admin
      .from('skill_tiers')
      .select('id')
      .eq('skill_id', pullUpSkill.id)
      .eq('rank', 'bronze')
      .single();
    if (bronzeTierError) throw new Error(`Lecture skill_tiers bronze (admin) : ${bronzeTierError.message}`);

    const { data: catalogAsB, error: catalogError } = await userB.client.from('skills').select('id').limit(1);
    check('SELECT skills (B lit le catalogue partagé)', !catalogError && (catalogAsB ?? []).length > 0, catalogError?.message);

    console.log("\nEnregistrement d'une progression de rang et d'une sélection de skill comme A...");
    const { data: skillProgress, error: progressError } = await userA.client
      .from('user_skill_progress')
      .insert({ user_id: userA.userId, skill_id: pullUpSkill.id, skill_tier_id: ironTier.id })
      .select()
      .single();
    if (progressError) throw new Error(`Insertion user_skill_progress (A) : ${progressError.message}`);

    const { error: selectionError } = await userA.client
      .from('user_skill_selection')
      .insert({ user_id: userA.userId, skill_id: pullUpSkill.id });
    if (selectionError) throw new Error(`Insertion user_skill_selection (A) : ${selectionError.message}`);

    console.log("\nVérification que l'utilisateur B ne peut PAS lire les données de A...");
    const tablesAndIds = [
      ['profiles', 'id', userA.userId],
      ['programs', 'id', program.id],
      ['program_sessions', 'id', programSession.id],
      ['session_exercises', 'id', sessionExercise.id],
      ['calendar_entries', 'id', calendarEntry.id],
      ['workout_logs', 'id', workoutLog.id],
      ['exercise_logs', 'id', exerciseLog.id],
      ['progress_photos', 'id', progressPhoto.id],
      ['user_skill_progress', 'id', skillProgress.id],
    ];

    for (const [table, idColumn, id] of tablesAndIds) {
      const { data, error } = await userB.client.from(table).select('*').eq(idColumn, id);
      check(`SELECT ${table} (B lit une ligne de A)`, !error && data.length === 0, error ? error.message : `${data.length} ligne(s) visible(s)`);
    }

    // user_skill_selection a une clé primaire composite (user_id, skill_id),
    // pas de colonne id — vérifié à part.
    const { data: selectionAsB, error: selectionSelectError } = await userB.client
      .from('user_skill_selection')
      .select('*')
      .eq('user_id', userA.userId);
    check(
      'SELECT user_skill_selection (B lit la sélection de A)',
      !selectionSelectError && selectionAsB.length === 0,
      selectionSelectError ? selectionSelectError.message : `${selectionAsB.length} ligne(s) visible(s)`
    );

    console.log("\nVérification que l'utilisateur B ne peut PAS modifier/supprimer les données de A...");
    const { data: updateData } = await userB.client
      .from('programs')
      .update({ name: 'Modifié par B' })
      .eq('id', program.id)
      .select();
    check('UPDATE programs (B modifie une ligne de A)', (updateData ?? []).length === 0, `${(updateData ?? []).length} ligne(s) modifiée(s)`);

    const { data: deleteData } = await userB.client.from('exercise_logs').delete().eq('id', exerciseLog.id).select();
    check('DELETE exercise_logs (B supprime une ligne de A)', (deleteData ?? []).length === 0, `${(deleteData ?? []).length} ligne(s) supprimée(s)`);

    const { data: deleteProgressData } = await userB.client
      .from('user_skill_progress')
      .delete()
      .eq('id', skillProgress.id)
      .select();
    check(
      'DELETE user_skill_progress (B supprime une progression de A)',
      (deleteProgressData ?? []).length === 0,
      `${(deleteProgressData ?? []).length} ligne(s) supprimée(s)`
    );

    const { error: deleteSelectionError } = await userB.client
      .from('user_skill_selection')
      .delete()
      .eq('user_id', userA.userId)
      .eq('skill_id', pullUpSkill.id);
    const { data: selectionStillThere } = await userA.client
      .from('user_skill_selection')
      .select('*')
      .eq('user_id', userA.userId)
      .eq('skill_id', pullUpSkill.id);
    check(
      'DELETE user_skill_selection (B supprime la sélection de A)',
      (selectionStillThere ?? []).length === 1,
      deleteSelectionError ? deleteSelectionError.message : 'la ligne de A a disparu après suppression par B'
    );

    console.log("\nVérification que B ne peut pas usurper l'identité de A à l'insertion...");
    const { data: impersonationData, error: impersonationError } = await userB.client
      .from('user_skill_progress')
      .insert({ user_id: userA.userId, skill_id: pullUpSkill.id, skill_tier_id: bronzeTier.id })
      .select();
    check(
      'INSERT user_skill_progress (B insère avec user_id = A)',
      !!impersonationError && (impersonationData ?? []).length === 0,
      impersonationError ? undefined : 'insertion réussie'
    );

    console.log("\nVérification des policies Storage (bucket progress-photos)...");
    const { data: bucket, error: bucketError } = await admin.storage.getBucket('progress-photos');
    check('Storage bucket progress-photos privé (public = false)', !bucketError && bucket?.public === false, bucketError?.message ?? `public: ${bucket?.public}`);

    const { data: downloadData, error: downloadError } = await userB.client.storage
      .from('progress-photos')
      .download(storagePath);
    check('Storage download (B lit le fichier de A)', !downloadData && !!downloadError, downloadError ? undefined : 'téléchargement réussi');

    const { data: listData } = await userB.client.storage.from('progress-photos').list(userA.userId);
    check("Storage list (B liste le dossier de A)", (listData ?? []).length === 0, `${(listData ?? []).length} fichier(s) visible(s)`);

    const { error: crossUploadError } = await userB.client.storage
      .from('progress-photos')
      .upload(`${userA.userId}/intrusion.jpg`, photoBytes, { contentType: 'image/jpeg' });
    check('Storage upload (B écrit dans le dossier de A)', !!crossUploadError, crossUploadError ? undefined : 'upload réussi');

    const { error: crossDeleteError } = await userB.client.storage.from('progress-photos').remove([storagePath]);
    const { data: stillThere } = await userA.client.storage.from('progress-photos').list(userA.userId);
    check(
      'Storage delete (B supprime le fichier de A)',
      (stillThere ?? []).some((f) => f.name === 'rls-test.jpg'),
      crossDeleteError ? crossDeleteError.message : 'fichier de A introuvable après suppression par B'
    );

    console.log("\nVérification que l'utilisateur A voit bien ses propres données...");
    const { data: ownData, error: ownError } = await userA.client.from('programs').select('*').eq('id', program.id);
    check('SELECT programs (A lit sa propre ligne)', !ownError && ownData.length === 1, ownError?.message);

    const { data: ownDownload, error: ownDownloadError } = await userA.client.storage
      .from('progress-photos')
      .download(storagePath);
    check('Storage download (A lit son propre fichier)', !ownDownloadError && !!ownDownload, ownDownloadError?.message);
  } finally {
    console.log('\nNettoyage des comptes de test...');
    await admin.storage.from('progress-photos').remove([`${userA.userId}/rls-test.jpg`, `${userA.userId}/intrusion.jpg`]);
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
