-- Cality : schéma initial (musculation / street workout tracker)
-- Toutes les tables sont protégées par Row Level Security : un utilisateur
-- ne peut lire/écrire que les lignes où user_id = auth.uid().

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto"; -- pour gen_random_uuid()

-- ============================================================================
-- Types énumérés
-- ============================================================================

-- Type d'exercice : détermine quels champs sont pertinents dans session_exercises
-- et exercise_logs.
--   reps_weight  -> séries x reps x charge (ex: développé couché 4x8 @60kg)
--   isometric    -> séries x temps de maintien (ex: front lever tuck 3x15s)
--   progression  -> suivi par variante/niveau (ex: muscle-up strict vs kipping)
create type exercise_type as enum ('reps_weight', 'isometric', 'progression');

-- Statut d'une séance planifiée dans le calendrier
create type calendar_status as enum ('planned', 'done', 'skipped');

-- Clé canonique pour les 5 skills suivis dans la vue "Skills" dédiée.
-- Nullable partout où elle apparaît : seuls les exercices liés à un objectif
-- suivi ont une skill_key, les autres exercices restent en texte libre.
create type skill_key as enum ('muscle_up', 'hspu', 'l_sit', 'front_lever', 'pull_up');

-- ============================================================================
-- Fonction utilitaire : maintien automatique de updated_at
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- profiles : extension de auth.users avec les infos affichées dans l'app
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  goals skill_key[] not null default '{}', -- objectifs affichés sur le profil
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Crée automatiquement une ligne profiles à l'inscription d'un utilisateur.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- programs : programmes d'entraînement créés par l'utilisateur
-- ============================================================================
create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index programs_user_id_idx on programs(user_id);

alter table programs enable row level security;

create policy "programs_select_own" on programs
  for select using (auth.uid() = user_id);
create policy "programs_insert_own" on programs
  for insert with check (auth.uid() = user_id);
create policy "programs_update_own" on programs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "programs_delete_own" on programs
  for delete using (auth.uid() = user_id);

create trigger programs_set_updated_at
  before update on programs
  for each row execute function set_updated_at();

-- ============================================================================
-- program_sessions : séances types appartenant à un programme
-- (ex: "Push", "Pull", "Legs", "Skills")
-- ============================================================================
create table program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position int not null default 0, -- ordre d'affichage dans le programme
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index program_sessions_program_id_idx on program_sessions(program_id);
create index program_sessions_user_id_idx on program_sessions(user_id);

alter table program_sessions enable row level security;

create policy "program_sessions_select_own" on program_sessions
  for select using (auth.uid() = user_id);
create policy "program_sessions_insert_own" on program_sessions
  for insert with check (auth.uid() = user_id);
create policy "program_sessions_update_own" on program_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "program_sessions_delete_own" on program_sessions
  for delete using (auth.uid() = user_id);

create trigger program_sessions_set_updated_at
  before update on program_sessions
  for each row execute function set_updated_at();

-- ============================================================================
-- session_exercises : exercices d'une séance type
-- Les colonnes utilisées dépendent de `type` :
--   reps_weight  -> target_reps, target_weight_kg
--   isometric    -> target_hold_seconds
--   progression  -> progression_variant
-- ============================================================================
create table session_exercises (
  id uuid primary key default gen_random_uuid(),
  program_session_id uuid not null references program_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type exercise_type not null,
  skill_key skill_key, -- tag optionnel pour la vue Skills (muscle-up, HSPU, L-sit, front lever, tractions)
  position int not null default 0,
  target_sets int not null default 1,
  target_reps int,
  target_weight_kg numeric(6, 2),
  target_hold_seconds int,
  progression_variant text, -- ex: "strict", "kipping", "tuck", "straddle", "full"
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_exercises_type_fields_chk check (
    (type = 'reps_weight') or
    (type = 'isometric') or
    (type = 'progression')
  )
);

create index session_exercises_program_session_id_idx on session_exercises(program_session_id);
create index session_exercises_user_id_idx on session_exercises(user_id);
create index session_exercises_skill_key_idx on session_exercises(skill_key);

alter table session_exercises enable row level security;

create policy "session_exercises_select_own" on session_exercises
  for select using (auth.uid() = user_id);
create policy "session_exercises_insert_own" on session_exercises
  for insert with check (auth.uid() = user_id);
create policy "session_exercises_update_own" on session_exercises
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "session_exercises_delete_own" on session_exercises
  for delete using (auth.uid() = user_id);

create trigger session_exercises_set_updated_at
  before update on session_exercises
  for each row execute function set_updated_at();

-- ============================================================================
-- calendar_entries : assignation d'une séance type à une date donnée
-- ============================================================================
create table calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_session_id uuid not null references program_sessions(id) on delete cascade,
  scheduled_date date not null,
  status calendar_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_entries_user_id_date_idx on calendar_entries(user_id, scheduled_date);

alter table calendar_entries enable row level security;

create policy "calendar_entries_select_own" on calendar_entries
  for select using (auth.uid() = user_id);
create policy "calendar_entries_insert_own" on calendar_entries
  for insert with check (auth.uid() = user_id);
create policy "calendar_entries_update_own" on calendar_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar_entries_delete_own" on calendar_entries
  for delete using (auth.uid() = user_id);

create trigger calendar_entries_set_updated_at
  before update on calendar_entries
  for each row execute function set_updated_at();

-- ============================================================================
-- workout_logs : séance réellement effectuée (planifiée ou libre)
-- ============================================================================
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calendar_entry_id uuid references calendar_entries(id) on delete set null,
  session_name text not null, -- copie du nom au moment du log (garde l'historique lisible)
  performed_date date not null default current_date,
  notes text, -- RPE / sensations, champ libre optionnel
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_logs_user_id_date_idx on workout_logs(user_id, performed_date);
create index workout_logs_calendar_entry_id_idx on workout_logs(calendar_entry_id);

alter table workout_logs enable row level security;

create policy "workout_logs_select_own" on workout_logs
  for select using (auth.uid() = user_id);
create policy "workout_logs_insert_own" on workout_logs
  for insert with check (auth.uid() = user_id);
create policy "workout_logs_update_own" on workout_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_logs_delete_own" on workout_logs
  for delete using (auth.uid() = user_id);

create trigger workout_logs_set_updated_at
  before update on workout_logs
  for each row execute function set_updated_at();

-- ============================================================================
-- exercise_logs : performance réelle par exercice et par série
-- (une ligne = une série effectuée, ce qui permet des graphiques précis)
-- ============================================================================
create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references workout_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_exercise_id uuid references session_exercises(id) on delete set null,
  exercise_name text not null, -- copie du nom au moment du log
  type exercise_type not null,
  skill_key skill_key,
  set_number int not null default 1,
  reps int,
  weight_kg numeric(6, 2),
  hold_seconds int,
  progression_variant text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercise_logs_workout_log_id_idx on exercise_logs(workout_log_id);
create index exercise_logs_user_id_idx on exercise_logs(user_id);
create index exercise_logs_skill_key_idx on exercise_logs(user_id, skill_key, created_at);
create index exercise_logs_exercise_name_idx on exercise_logs(user_id, exercise_name, created_at);

alter table exercise_logs enable row level security;

create policy "exercise_logs_select_own" on exercise_logs
  for select using (auth.uid() = user_id);
create policy "exercise_logs_insert_own" on exercise_logs
  for insert with check (auth.uid() = user_id);
create policy "exercise_logs_update_own" on exercise_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exercise_logs_delete_own" on exercise_logs
  for delete using (auth.uid() = user_id);

create trigger exercise_logs_set_updated_at
  before update on exercise_logs
  for each row execute function set_updated_at();
