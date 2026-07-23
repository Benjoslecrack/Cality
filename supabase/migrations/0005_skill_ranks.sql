-- v4 : système de rangs (Fer -> Bronze -> Argent -> Or -> Maître) sur un
-- catalogue de 10 skills street workout, remplaçant l'ancien système à 5
-- skills fixes (skill_key + skillMilestones.ts côté app).
--
-- skills / skill_tiers / skill_tier_criteria sont un référentiel PARTAGÉ
-- (pas de propriétaire) : RLS activé mais lecture ouverte à tous, écriture
-- réservée au rôle service_role (migrations), pas de policy insert/update/
-- delete pour les utilisateurs.
--
-- user_skill_progress / user_skill_selection restent sur le pattern
-- owner-only habituel du projet.

-- ============================================================================
-- Types énumérés
-- ============================================================================
create type skill_rank as enum ('iron', 'bronze', 'silver', 'gold', 'master');
-- L'ordre de déclaration donne l'ordre de comparaison Postgres (iron < ... < master),
-- utilisé pour déduire le rang courant via max(rank) plutôt que de le stocker.

create type skill_criterion_type as enum ('hold_seconds', 'reps', 'variant');

-- ============================================================================
-- skills : catalogue global des skills suivis
-- ============================================================================
create table skills (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table skills enable row level security;
create policy "skills_select_all" on skills for select using (true);

create trigger skills_set_updated_at
  before update on skills
  for each row execute function set_updated_at();

-- ============================================================================
-- skill_tiers : les 5 rangs par skill
-- ============================================================================
create table skill_tiers (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references skills(id) on delete cascade,
  rank skill_rank not null,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_id, rank)
);

create index skill_tiers_skill_id_idx on skill_tiers(skill_id);

alter table skill_tiers enable row level security;
create policy "skill_tiers_select_all" on skill_tiers for select using (true);

create trigger skill_tiers_set_updated_at
  before update on skill_tiers
  for each row execute function set_updated_at();

-- ============================================================================
-- skill_tier_criteria : critère(s) de validation d'un palier.
-- Un palier est débloqué si AU MOINS UNE de ses lignes de critère est
-- satisfaite (ex: "traction lestée OU traction archer" = 2 lignes pour le
-- même palier). Le type de mesure (hold_seconds/reps) est vérifié sur les
-- champs correspondants de exercise_logs ; variant_match est comparé (en
-- sous-chaîne, insensible à la casse) à exercise_logs.progression_variant,
-- soit seul (criterion_type = 'variant'), soit en filtre additionnel pour
-- désambiguïser des paliers au même seuil (ex: front lever tuck 10s vs
-- tuck avancé 10s).
-- ============================================================================
create table skill_tier_criteria (
  id uuid primary key default gen_random_uuid(),
  skill_tier_id uuid not null references skill_tiers(id) on delete cascade,
  criterion_type skill_criterion_type not null,
  threshold numeric,
  variant_match text,
  created_at timestamptz not null default now(),
  constraint skill_tier_criteria_threshold_chk check (
    (criterion_type = 'variant' and threshold is null) or
    (criterion_type in ('hold_seconds', 'reps') and threshold is not null)
  )
);

create index skill_tier_criteria_skill_tier_id_idx on skill_tier_criteria(skill_tier_id);

alter table skill_tier_criteria enable row level security;
create policy "skill_tier_criteria_select_all" on skill_tier_criteria for select using (true);

-- ============================================================================
-- user_skill_progress : un enregistrement par palier obtenu (pas une ligne
-- unique par skill avec 5 colonnes de date) — le rang courant se déduit par
-- max(rank) plutôt que d'être stocké, pour éviter toute désync.
-- ============================================================================
create table user_skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  skill_tier_id uuid not null references skill_tiers(id) on delete cascade,
  achieved_at timestamptz not null default now(),
  exercise_log_id uuid references exercise_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, skill_tier_id)
);

create index user_skill_progress_user_skill_idx on user_skill_progress(user_id, skill_id);

alter table user_skill_progress enable row level security;
create policy "user_skill_progress_select_own" on user_skill_progress
  for select using (auth.uid() = user_id);
create policy "user_skill_progress_insert_own" on user_skill_progress
  for insert with check (auth.uid() = user_id);
create policy "user_skill_progress_update_own" on user_skill_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_skill_progress_delete_own" on user_skill_progress
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- user_skill_selection : présence d'une ligne = skill actif pour l'utilisateur.
-- Désactiver un skill supprime uniquement cette ligne, jamais la progression.
-- ============================================================================
create table user_skill_selection (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

alter table user_skill_selection enable row level security;
create policy "user_skill_selection_select_own" on user_skill_selection
  for select using (auth.uid() = user_id);
create policy "user_skill_selection_insert_own" on user_skill_selection
  for insert with check (auth.uid() = user_id);
create policy "user_skill_selection_delete_own" on user_skill_selection
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Lien exercise_logs / session_exercises -> skills (additif, non destructif :
-- l'ancien enum skill_key est conservé pour l'instant).
-- ============================================================================
alter table exercise_logs add column skill_id uuid references skills(id);
create index exercise_logs_skill_id_idx on exercise_logs(user_id, skill_id, created_at);

alter table session_exercises add column skill_id uuid references skills(id);
create index session_exercises_skill_id_idx on session_exercises(skill_id);

-- ============================================================================
-- Seed : catalogue des 10 skills (les 5 premiers reprennent exactement les
-- clés de l'ancien enum skill_key pour un rétro-remplissage direct).
-- ============================================================================
insert into skills (key, name, position) values
  ('pull_up', 'Tractions', 0),
  ('muscle_up', 'Muscle-up', 1),
  ('hspu', 'Handstand / HSPU', 2),
  ('l_sit', 'L-sit / V-sit', 3),
  ('front_lever', 'Front lever', 4),
  ('back_lever', 'Back lever', 5),
  ('planche', 'Planche', 6),
  ('human_flag', 'Human flag', 7),
  ('pistol_squat', 'Pistol squat', 8),
  ('dragon_flag', 'Dragon flag', 9);

-- ============================================================================
-- Seed : 5 paliers par skill
-- ============================================================================
with tier_seed(skill_key, rank, label) as (
  values
    ('pull_up', 'iron'::skill_rank, 'Dead hang 20s'),
    ('pull_up', 'bronze'::skill_rank, '1 traction stricte'),
    ('pull_up', 'silver'::skill_rank, '10 tractions strictes'),
    ('pull_up', 'gold'::skill_rank, 'Traction lestée (+20% du poids de corps) ou traction archer'),
    ('pull_up', 'master'::skill_rank, 'Traction à un bras'),

    ('muscle_up', 'iron'::skill_rank, 'Traction + dip enchaînés séparément'),
    ('muscle_up', 'bronze'::skill_rank, 'Muscle-up kipping'),
    ('muscle_up', 'silver'::skill_rank, 'Muscle-up strict'),
    ('muscle_up', 'gold'::skill_rank, 'Muscle-up strict lesté'),
    ('muscle_up', 'master'::skill_rank, 'Muscle-up à un bras ou 5 muscle-up stricts enchaînés'),

    ('hspu', 'iron'::skill_rank, 'Handstand au mur tenu 30s'),
    ('hspu', 'bronze'::skill_rank, 'Handstand en équilibre libre 10s'),
    ('hspu', 'silver'::skill_rank, 'HSPU au mur x5'),
    ('hspu', 'gold'::skill_rank, 'HSPU en équilibre libre x3'),
    ('hspu', 'master'::skill_rank, 'HSPU à un bras'),

    ('l_sit', 'iron'::skill_rank, 'L-sit tuck tenu 10s'),
    ('l_sit', 'bronze'::skill_rank, 'L-sit une jambe tenu 10s'),
    ('l_sit', 'silver'::skill_rank, 'L-sit complet tenu 20s'),
    ('l_sit', 'gold'::skill_rank, 'V-sit tenu 10s'),
    ('l_sit', 'master'::skill_rank, 'Manna'),

    ('front_lever', 'iron'::skill_rank, 'Front lever tuck tenu 10s'),
    ('front_lever', 'bronze'::skill_rank, 'Front lever tuck avancé tenu 10s'),
    ('front_lever', 'silver'::skill_rank, 'Front lever une jambe tenu 10s'),
    ('front_lever', 'gold'::skill_rank, 'Front lever complet tenu 10s'),
    ('front_lever', 'master'::skill_rank, 'Front lever à un bras'),

    ('back_lever', 'iron'::skill_rank, 'Back lever tuck tenu 10s'),
    ('back_lever', 'bronze'::skill_rank, 'Back lever tuck avancé tenu 10s'),
    ('back_lever', 'silver'::skill_rank, 'Back lever straddle tenu 10s'),
    ('back_lever', 'gold'::skill_rank, 'Back lever complet tenu 10s'),
    ('back_lever', 'master'::skill_rank, 'Back lever à un bras'),

    ('planche', 'iron'::skill_rank, 'Planche tuck tenue 10s'),
    ('planche', 'bronze'::skill_rank, 'Planche tuck avancée tenue 10s'),
    ('planche', 'silver'::skill_rank, 'Planche straddle tenue 10s'),
    ('planche', 'gold'::skill_rank, 'Planche complète tenue 5s'),
    ('planche', 'master'::skill_rank, 'Planche push-up complet'),

    ('human_flag', 'iron'::skill_rank, 'Human flag tuck tenu 5s'),
    ('human_flag', 'bronze'::skill_rank, 'Human flag une jambe tenu 5s'),
    ('human_flag', 'silver'::skill_rank, 'Human flag straddle tenu 5s'),
    ('human_flag', 'gold'::skill_rank, 'Human flag complet tenu 5s'),
    ('human_flag', 'master'::skill_rank, 'Human flag complet tenu 15s+'),

    ('pistol_squat', 'iron'::skill_rank, 'Pistol assisté (support)'),
    ('pistol_squat', 'bronze'::skill_rank, 'Pistol complet x1 chaque jambe'),
    ('pistol_squat', 'silver'::skill_rank, 'Pistol complet x5 chaque jambe'),
    ('pistol_squat', 'gold'::skill_rank, 'Pistol lesté'),
    ('pistol_squat', 'master'::skill_rank, 'Shrimp squat complet'),

    ('dragon_flag', 'iron'::skill_rank, 'Dragon flag assisté (genoux fléchis)'),
    ('dragon_flag', 'bronze'::skill_rank, 'Dragon flag complet x1'),
    ('dragon_flag', 'silver'::skill_rank, 'Dragon flag complet x5'),
    ('dragon_flag', 'gold'::skill_rank, 'Dragon flag négatif contrôlé (3s de descente) x5'),
    ('dragon_flag', 'master'::skill_rank, 'Dragon flag à une jambe')
)
insert into skill_tiers (skill_id, rank, label)
select s.id, t.rank, t.label
from tier_seed t
join skills s on s.key = t.skill_key;

-- ============================================================================
-- Seed : critères de validation par palier. Toute variante spécifique
-- (strict, lesté, à un bras, etc.) est auto-déclarée par l'utilisateur au
-- moment du log — comme c'était déjà le cas pour "muscle-up strict" dans
-- l'ancien système — le système ne recalcule pas indépendamment une charge
-- relative au poids de corps ou une forme technique.
-- ============================================================================
with criteria_seed(skill_key, rank, criterion_type, threshold, variant_match) as (
  values
    ('pull_up', 'iron'::skill_rank, 'hold_seconds'::skill_criterion_type, 20::numeric, null),
    ('pull_up', 'bronze'::skill_rank, 'reps'::skill_criterion_type, 1::numeric, 'strict'),
    ('pull_up', 'silver'::skill_rank, 'reps'::skill_criterion_type, 10::numeric, 'strict'),
    ('pull_up', 'gold'::skill_rank, 'variant'::skill_criterion_type, null, 'weighted'),
    ('pull_up', 'gold'::skill_rank, 'variant'::skill_criterion_type, null, 'archer'),
    ('pull_up', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'one_arm'),

    ('muscle_up', 'iron'::skill_rank, 'variant'::skill_criterion_type, null, 'pull_up_dip_separate'),
    ('muscle_up', 'bronze'::skill_rank, 'variant'::skill_criterion_type, null, 'kipping'),
    ('muscle_up', 'silver'::skill_rank, 'variant'::skill_criterion_type, null, 'strict'),
    ('muscle_up', 'gold'::skill_rank, 'variant'::skill_criterion_type, null, 'strict_weighted'),
    ('muscle_up', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'one_arm'),
    ('muscle_up', 'master'::skill_rank, 'reps'::skill_criterion_type, 5::numeric, 'strict'),

    ('hspu', 'iron'::skill_rank, 'hold_seconds'::skill_criterion_type, 30::numeric, 'wall'),
    ('hspu', 'bronze'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'freestanding'),
    ('hspu', 'silver'::skill_rank, 'reps'::skill_criterion_type, 5::numeric, 'wall'),
    ('hspu', 'gold'::skill_rank, 'reps'::skill_criterion_type, 3::numeric, 'freestanding'),
    ('hspu', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'one_arm'),

    ('l_sit', 'iron'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('l_sit', 'bronze'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'one_leg'),
    ('l_sit', 'silver'::skill_rank, 'hold_seconds'::skill_criterion_type, 20::numeric, 'full'),
    ('l_sit', 'gold'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'v_sit'),
    ('l_sit', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'manna'),

    ('front_lever', 'iron'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('front_lever', 'bronze'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'advanced_tuck'),
    ('front_lever', 'silver'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'one_leg'),
    ('front_lever', 'gold'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'full'),
    ('front_lever', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'one_arm'),

    ('back_lever', 'iron'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('back_lever', 'bronze'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'advanced_tuck'),
    ('back_lever', 'silver'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'straddle'),
    ('back_lever', 'gold'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'full'),
    ('back_lever', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'one_arm'),

    ('planche', 'iron'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('planche', 'bronze'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'advanced_tuck'),
    ('planche', 'silver'::skill_rank, 'hold_seconds'::skill_criterion_type, 10::numeric, 'straddle'),
    ('planche', 'gold'::skill_rank, 'hold_seconds'::skill_criterion_type, 5::numeric, 'full'),
    ('planche', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'push_up'),

    ('human_flag', 'iron'::skill_rank, 'hold_seconds'::skill_criterion_type, 5::numeric, 'tuck'),
    ('human_flag', 'bronze'::skill_rank, 'hold_seconds'::skill_criterion_type, 5::numeric, 'one_leg'),
    ('human_flag', 'silver'::skill_rank, 'hold_seconds'::skill_criterion_type, 5::numeric, 'straddle'),
    ('human_flag', 'gold'::skill_rank, 'hold_seconds'::skill_criterion_type, 5::numeric, 'full'),
    ('human_flag', 'master'::skill_rank, 'hold_seconds'::skill_criterion_type, 15::numeric, 'full'),

    ('pistol_squat', 'iron'::skill_rank, 'variant'::skill_criterion_type, null, 'assisted'),
    ('pistol_squat', 'bronze'::skill_rank, 'reps'::skill_criterion_type, 1::numeric, 'full'),
    ('pistol_squat', 'silver'::skill_rank, 'reps'::skill_criterion_type, 5::numeric, 'full'),
    ('pistol_squat', 'gold'::skill_rank, 'variant'::skill_criterion_type, null, 'weighted'),
    ('pistol_squat', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'shrimp'),

    ('dragon_flag', 'iron'::skill_rank, 'variant'::skill_criterion_type, null, 'assisted'),
    ('dragon_flag', 'bronze'::skill_rank, 'reps'::skill_criterion_type, 1::numeric, 'full'),
    ('dragon_flag', 'silver'::skill_rank, 'reps'::skill_criterion_type, 5::numeric, 'full'),
    ('dragon_flag', 'gold'::skill_rank, 'reps'::skill_criterion_type, 5::numeric, 'negative'),
    ('dragon_flag', 'master'::skill_rank, 'variant'::skill_criterion_type, null, 'one_leg')
)
insert into skill_tier_criteria (skill_tier_id, criterion_type, threshold, variant_match)
select st.id, c.criterion_type, c.threshold, c.variant_match
from criteria_seed c
join skills s on s.key = c.skill_key
join skill_tiers st on st.skill_id = s.id and st.rank = c.rank;

-- ============================================================================
-- Rétro-remplissage : les logs déjà tagués avec l'ancien enum skill_key
-- pointent désormais aussi vers le nouveau catalogue (5 clés communes).
-- ============================================================================
update exercise_logs el set skill_id = s.id
from skills s
where el.skill_key is not null and s.key = el.skill_key::text;

update session_exercises se set skill_id = s.id
from skills s
where se.skill_key is not null and s.key = se.skill_key::text;

-- ============================================================================
-- Sélection par défaut : les utilisateurs existants gardent visibles les 5
-- skills qu'ils suivaient déjà (rien ne "disparaît" après cette migration).
-- Nouveaux utilisateurs : sélection vide, à choisir via l'écran dédié.
-- ============================================================================
insert into user_skill_selection (user_id, skill_id)
select p.id, s.id
from profiles p
cross join skills s
where s.key in ('pull_up', 'muscle_up', 'hspu', 'l_sit', 'front_lever')
on conflict (user_id, skill_id) do nothing;
