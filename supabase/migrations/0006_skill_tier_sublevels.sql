-- v4 (suite) : chaque rang macro (Fer..Maître) se subdivise en 3 paliers
-- (I/II/III), soit 15 paliers par skill au lieu de 5 — progression plus fine
-- et plus régulièrement gratifiante. Le passage I->II->III fait simplement
-- avancer la barre-signature ; le passage au rang macro suivant déclenche en
-- plus le badge de rang (logique déjà en place, inchangée : currentRank()
-- ignore sub_level et ne regarde que `rank`).
--
-- Les anciens paliers (5 par skill) sont remplacés, pas complétés : toute
-- progression déjà enregistrée dessus est perdue (cascade via
-- user_skill_progress.skill_tier_id). Accepté explicitement — projet encore
-- en phase de construction.

delete from skill_tiers; -- cascade sur skill_tier_criteria et user_skill_progress

alter table skill_tiers
  add column sub_level smallint not null default 1 check (sub_level between 1 and 3),
  add column position smallint not null default 0;

alter table skill_tiers drop constraint skill_tiers_skill_id_rank_key;
alter table skill_tiers add constraint skill_tiers_skill_id_rank_sub_level_key unique (skill_id, rank, sub_level);

-- ============================================================================
-- Seed : 15 paliers par skill (position 0-14 = rang_index*3 + (sous-niveau-1))
-- ============================================================================
with tier_seed(skill_key, rank, sub_level, position, label) as (
  values
    -- Tractions (pull_up)
    ('pull_up', 'iron'::skill_rank, 1, 0, 'Dead hang 10s'),
    ('pull_up', 'iron'::skill_rank, 2, 1, 'Dead hang 20s'),
    ('pull_up', 'iron'::skill_rank, 3, 2, 'Dead hang 30s + première négative contrôlée (5s)'),
    ('pull_up', 'bronze'::skill_rank, 1, 3, '1 traction stricte'),
    ('pull_up', 'bronze'::skill_rank, 2, 4, '3 tractions strictes'),
    ('pull_up', 'bronze'::skill_rank, 3, 5, '6 tractions strictes'),
    ('pull_up', 'silver'::skill_rank, 1, 6, '8 tractions strictes'),
    ('pull_up', 'silver'::skill_rank, 2, 7, '10 tractions strictes'),
    ('pull_up', 'silver'::skill_rank, 3, 8, '12 tractions strictes'),
    ('pull_up', 'gold'::skill_rank, 1, 9, 'Traction lestée +10% du poids de corps'),
    ('pull_up', 'gold'::skill_rank, 2, 10, 'Traction lestée +20% du poids de corps'),
    ('pull_up', 'gold'::skill_rank, 3, 11, 'Traction archer (1 répétition propre)'),
    ('pull_up', 'master'::skill_rank, 1, 12, 'Traction à un bras assistée (élastique fort)'),
    ('pull_up', 'master'::skill_rank, 2, 13, 'Traction à un bras assistée (élastique léger)'),
    ('pull_up', 'master'::skill_rank, 3, 14, 'Traction à un bras stricte'),

    -- Muscle-up
    ('muscle_up', 'iron'::skill_rank, 1, 0, 'Traction poitrine (chest-to-bar) x3'),
    ('muscle_up', 'iron'::skill_rank, 2, 1, 'Traction poitrine x5 + dips x5 enchaînés séparément'),
    ('muscle_up', 'iron'::skill_rank, 3, 2, 'Muscle-up négatif contrôlé (3s de descente)'),
    ('muscle_up', 'bronze'::skill_rank, 1, 3, 'Muscle-up kipping x1'),
    ('muscle_up', 'bronze'::skill_rank, 2, 4, 'Muscle-up kipping x3'),
    ('muscle_up', 'bronze'::skill_rank, 3, 5, 'Muscle-up kipping x5 enchaînés'),
    ('muscle_up', 'silver'::skill_rank, 1, 6, 'Muscle-up strict x1'),
    ('muscle_up', 'silver'::skill_rank, 2, 7, 'Muscle-up strict x3'),
    ('muscle_up', 'silver'::skill_rank, 3, 8, 'Muscle-up strict x5 enchaînés'),
    ('muscle_up', 'gold'::skill_rank, 1, 9, 'Muscle-up strict lesté +5%'),
    ('muscle_up', 'gold'::skill_rank, 2, 10, 'Muscle-up strict lesté +10%'),
    ('muscle_up', 'gold'::skill_rank, 3, 11, 'Muscle-up strict lesté +15%'),
    ('muscle_up', 'master'::skill_rank, 1, 12, 'Muscle-up à un bras assisté (élastique fort)'),
    ('muscle_up', 'master'::skill_rank, 2, 13, 'Muscle-up à un bras assisté (élastique léger)'),
    ('muscle_up', 'master'::skill_rank, 3, 14, 'Muscle-up à un bras (tentative complète)'),

    -- Handstand / HSPU
    ('hspu', 'iron'::skill_rank, 1, 0, 'Handstand au mur tenu 10s'),
    ('hspu', 'iron'::skill_rank, 2, 1, 'Handstand au mur tenu 20s'),
    ('hspu', 'iron'::skill_rank, 3, 2, 'Handstand au mur tenu 45s'),
    ('hspu', 'bronze'::skill_rank, 1, 3, 'Handstand en équilibre libre tenu 5s'),
    ('hspu', 'bronze'::skill_rank, 2, 4, 'Handstand en équilibre libre tenu 10s'),
    ('hspu', 'bronze'::skill_rank, 3, 5, 'Handstand en équilibre libre tenu 20s'),
    ('hspu', 'silver'::skill_rank, 1, 6, 'HSPU au mur x1'),
    ('hspu', 'silver'::skill_rank, 2, 7, 'HSPU au mur x3'),
    ('hspu', 'silver'::skill_rank, 3, 8, 'HSPU au mur x6'),
    ('hspu', 'gold'::skill_rank, 1, 9, 'HSPU en équilibre libre x1'),
    ('hspu', 'gold'::skill_rank, 2, 10, 'HSPU en équilibre libre x3'),
    ('hspu', 'gold'::skill_rank, 3, 11, 'HSPU en équilibre libre x5'),
    ('hspu', 'master'::skill_rank, 1, 12, 'HSPU à un bras assisté (pieds au mur)'),
    ('hspu', 'master'::skill_rank, 2, 13, 'HSPU à un bras tenu 5s (sans push-up)'),
    ('hspu', 'master'::skill_rank, 3, 14, 'HSPU à un bras x1'),

    -- L-sit / V-sit
    ('l_sit', 'iron'::skill_rank, 1, 0, 'L-sit tuck tenu 5s'),
    ('l_sit', 'iron'::skill_rank, 2, 1, 'L-sit tuck tenu 10s'),
    ('l_sit', 'iron'::skill_rank, 3, 2, 'L-sit tuck tenu 20s'),
    ('l_sit', 'bronze'::skill_rank, 1, 3, 'L-sit une jambe tenu 5s'),
    ('l_sit', 'bronze'::skill_rank, 2, 4, 'L-sit une jambe tenu 10s'),
    ('l_sit', 'bronze'::skill_rank, 3, 5, 'L-sit une jambe tenu 20s'),
    ('l_sit', 'silver'::skill_rank, 1, 6, 'L-sit complet tenu 5s'),
    ('l_sit', 'silver'::skill_rank, 2, 7, 'L-sit complet tenu 10s'),
    ('l_sit', 'silver'::skill_rank, 3, 8, 'L-sit complet tenu 20s'),
    ('l_sit', 'gold'::skill_rank, 1, 9, 'V-sit tenu 5s'),
    ('l_sit', 'gold'::skill_rank, 2, 10, 'V-sit tenu 10s'),
    ('l_sit', 'gold'::skill_rank, 3, 11, 'V-sit tenu 15s'),
    ('l_sit', 'master'::skill_rank, 1, 12, 'Manna tuck tenu 3s'),
    ('l_sit', 'master'::skill_rank, 2, 13, 'Manna une jambe tenu 3s'),
    ('l_sit', 'master'::skill_rank, 3, 14, 'Manna complet tenu 2s'),

    -- Front lever
    ('front_lever', 'iron'::skill_rank, 1, 0, 'Front lever tuck tenu 5s'),
    ('front_lever', 'iron'::skill_rank, 2, 1, 'Front lever tuck tenu 10s'),
    ('front_lever', 'iron'::skill_rank, 3, 2, 'Front lever tuck tenu 20s'),
    ('front_lever', 'bronze'::skill_rank, 1, 3, 'Front lever tuck avancé tenu 5s'),
    ('front_lever', 'bronze'::skill_rank, 2, 4, 'Front lever tuck avancé tenu 10s'),
    ('front_lever', 'bronze'::skill_rank, 3, 5, 'Front lever tuck avancé tenu 20s'),
    ('front_lever', 'silver'::skill_rank, 1, 6, 'Front lever une jambe tenu 5s'),
    ('front_lever', 'silver'::skill_rank, 2, 7, 'Front lever une jambe tenu 10s'),
    ('front_lever', 'silver'::skill_rank, 3, 8, 'Front lever une jambe tenu 15s'),
    ('front_lever', 'gold'::skill_rank, 1, 9, 'Front lever straddle tenu 5s'),
    ('front_lever', 'gold'::skill_rank, 2, 10, 'Front lever complet tenu 5s'),
    ('front_lever', 'gold'::skill_rank, 3, 11, 'Front lever complet tenu 10s'),
    ('front_lever', 'master'::skill_rank, 1, 12, 'Front lever à un bras assisté (une jambe tuck)'),
    ('front_lever', 'master'::skill_rank, 2, 13, 'Front lever à un bras straddle'),
    ('front_lever', 'master'::skill_rank, 3, 14, 'Front lever à un bras complet tenu 3s'),

    -- Back lever
    ('back_lever', 'iron'::skill_rank, 1, 0, 'Back lever tuck tenu 5s'),
    ('back_lever', 'iron'::skill_rank, 2, 1, 'Back lever tuck tenu 10s'),
    ('back_lever', 'iron'::skill_rank, 3, 2, 'Back lever tuck tenu 20s'),
    ('back_lever', 'bronze'::skill_rank, 1, 3, 'Back lever tuck avancé tenu 5s'),
    ('back_lever', 'bronze'::skill_rank, 2, 4, 'Back lever tuck avancé tenu 10s'),
    ('back_lever', 'bronze'::skill_rank, 3, 5, 'Back lever tuck avancé tenu 20s'),
    ('back_lever', 'silver'::skill_rank, 1, 6, 'Back lever straddle tenu 5s'),
    ('back_lever', 'silver'::skill_rank, 2, 7, 'Back lever straddle tenu 10s'),
    ('back_lever', 'silver'::skill_rank, 3, 8, 'Back lever straddle tenu 15s'),
    ('back_lever', 'gold'::skill_rank, 1, 9, 'Back lever complet tenu 5s'),
    ('back_lever', 'gold'::skill_rank, 2, 10, 'Back lever complet tenu 10s'),
    ('back_lever', 'gold'::skill_rank, 3, 11, 'Back lever complet tenu 15s'),
    ('back_lever', 'master'::skill_rank, 1, 12, 'Back lever à un bras assisté (une jambe tuck)'),
    ('back_lever', 'master'::skill_rank, 2, 13, 'Back lever à un bras straddle'),
    ('back_lever', 'master'::skill_rank, 3, 14, 'Back lever à un bras complet tenu 3s'),

    -- Planche
    ('planche', 'iron'::skill_rank, 1, 0, 'Planche tuck tenue 5s'),
    ('planche', 'iron'::skill_rank, 2, 1, 'Planche tuck tenue 10s'),
    ('planche', 'iron'::skill_rank, 3, 2, 'Planche tuck tenue 20s'),
    ('planche', 'bronze'::skill_rank, 1, 3, 'Planche tuck avancée tenue 5s'),
    ('planche', 'bronze'::skill_rank, 2, 4, 'Planche tuck avancée tenue 10s'),
    ('planche', 'bronze'::skill_rank, 3, 5, 'Planche tuck avancée tenue 20s'),
    ('planche', 'silver'::skill_rank, 1, 6, 'Planche straddle tenue 5s'),
    ('planche', 'silver'::skill_rank, 2, 7, 'Planche straddle tenue 10s'),
    ('planche', 'silver'::skill_rank, 3, 8, 'Planche straddle tenue 15s'),
    ('planche', 'gold'::skill_rank, 1, 9, 'Planche complète tenue 3s'),
    ('planche', 'gold'::skill_rank, 2, 10, 'Planche complète tenue 5s'),
    ('planche', 'gold'::skill_rank, 3, 11, 'Planche complète tenue 10s'),
    ('planche', 'master'::skill_rank, 1, 12, 'Planche push-up depuis straddle'),
    ('planche', 'master'::skill_rank, 2, 13, 'Planche push-up depuis planche complète x1'),
    ('planche', 'master'::skill_rank, 3, 14, 'Planche push-up complet x3'),

    -- Human flag
    ('human_flag', 'iron'::skill_rank, 1, 0, 'Human flag tuck tenu 3s'),
    ('human_flag', 'iron'::skill_rank, 2, 1, 'Human flag tuck tenu 5s'),
    ('human_flag', 'iron'::skill_rank, 3, 2, 'Human flag tuck tenu 10s'),
    ('human_flag', 'bronze'::skill_rank, 1, 3, 'Human flag une jambe tenu 3s'),
    ('human_flag', 'bronze'::skill_rank, 2, 4, 'Human flag une jambe tenu 5s'),
    ('human_flag', 'bronze'::skill_rank, 3, 5, 'Human flag une jambe tenu 10s'),
    ('human_flag', 'silver'::skill_rank, 1, 6, 'Human flag straddle tenu 3s'),
    ('human_flag', 'silver'::skill_rank, 2, 7, 'Human flag straddle tenu 5s'),
    ('human_flag', 'silver'::skill_rank, 3, 8, 'Human flag straddle tenu 10s'),
    ('human_flag', 'gold'::skill_rank, 1, 9, 'Human flag complet tenu 3s'),
    ('human_flag', 'gold'::skill_rank, 2, 10, 'Human flag complet tenu 5s'),
    ('human_flag', 'gold'::skill_rank, 3, 11, 'Human flag complet tenu 10s'),
    ('human_flag', 'master'::skill_rank, 1, 12, 'Human flag complet tenu 15s'),
    ('human_flag', 'master'::skill_rank, 2, 13, 'Human flag complet tenu 20s'),
    ('human_flag', 'master'::skill_rank, 3, 14, 'Human flag complet tenu 30s'),

    -- Pistol squat
    ('pistol_squat', 'iron'::skill_rank, 1, 0, 'Pistol assisté (support deux mains)'),
    ('pistol_squat', 'iron'::skill_rank, 2, 1, 'Pistol assisté (support une main)'),
    ('pistol_squat', 'iron'::skill_rank, 3, 2, 'Pistol assisté (élastique léger)'),
    ('pistol_squat', 'bronze'::skill_rank, 1, 3, 'Pistol complet x1 chaque jambe'),
    ('pistol_squat', 'bronze'::skill_rank, 2, 4, 'Pistol complet x3 chaque jambe'),
    ('pistol_squat', 'bronze'::skill_rank, 3, 5, 'Pistol complet x6 chaque jambe'),
    ('pistol_squat', 'silver'::skill_rank, 1, 6, 'Pistol complet x8 chaque jambe'),
    ('pistol_squat', 'silver'::skill_rank, 2, 7, 'Pistol complet x10 chaque jambe'),
    ('pistol_squat', 'silver'::skill_rank, 3, 8, 'Pistol complet x12 chaque jambe'),
    ('pistol_squat', 'gold'::skill_rank, 1, 9, 'Pistol lesté +10% du poids de corps'),
    ('pistol_squat', 'gold'::skill_rank, 2, 10, 'Pistol lesté +20% du poids de corps'),
    ('pistol_squat', 'gold'::skill_rank, 3, 11, 'Pistol lesté +30% du poids de corps'),
    ('pistol_squat', 'master'::skill_rank, 1, 12, 'Shrimp squat assisté'),
    ('pistol_squat', 'master'::skill_rank, 2, 13, 'Shrimp squat complet x1'),
    ('pistol_squat', 'master'::skill_rank, 3, 14, 'Shrimp squat complet x5'),

    -- Dragon flag
    ('dragon_flag', 'iron'::skill_rank, 1, 0, 'Dragon flag assisté (genoux très fléchis)'),
    ('dragon_flag', 'iron'::skill_rank, 2, 1, 'Dragon flag assisté (genoux mi-fléchis)'),
    ('dragon_flag', 'iron'::skill_rank, 3, 2, 'Dragon flag assisté (genoux légèrement fléchis)'),
    ('dragon_flag', 'bronze'::skill_rank, 1, 3, 'Dragon flag complet x1'),
    ('dragon_flag', 'bronze'::skill_rank, 2, 4, 'Dragon flag complet x3'),
    ('dragon_flag', 'bronze'::skill_rank, 3, 5, 'Dragon flag complet x6'),
    ('dragon_flag', 'silver'::skill_rank, 1, 6, 'Dragon flag complet x8'),
    ('dragon_flag', 'silver'::skill_rank, 2, 7, 'Dragon flag complet x10'),
    ('dragon_flag', 'silver'::skill_rank, 3, 8, 'Dragon flag complet x12'),
    ('dragon_flag', 'gold'::skill_rank, 1, 9, 'Dragon flag négatif contrôlé (3s de descente) x5'),
    ('dragon_flag', 'gold'::skill_rank, 2, 10, 'Dragon flag négatif contrôlé (5s de descente) x5'),
    ('dragon_flag', 'gold'::skill_rank, 3, 11, 'Dragon flag négatif contrôlé (5s de descente) x8'),
    ('dragon_flag', 'master'::skill_rank, 1, 12, 'Dragon flag à une jambe assisté'),
    ('dragon_flag', 'master'::skill_rank, 2, 13, 'Dragon flag à une jambe x1'),
    ('dragon_flag', 'master'::skill_rank, 3, 14, 'Dragon flag à une jambe x3')
)
insert into skill_tiers (skill_id, rank, sub_level, position, label)
select s.id, t.rank, t.sub_level, t.position, t.label
from tier_seed t
join skills s on s.key = t.skill_key;

-- ============================================================================
-- Seed : un critère par palier (plus de "OU" multi-critères : la granularité
-- à 15 paliers absorbe les anciennes alternatives en sous-niveaux distincts).
-- Comme pour l'ancien système, toute variante spécifique est auto-déclarée
-- par l'utilisateur au moment du log (pas de calcul indépendant de charge
-- relative au poids de corps ou de forme technique) ; les critères composés
-- ("+ première négative contrôlée", "+ dips séparés") ne retiennent que la
-- partie mesurable en une série (durée/reps), documentée dans le label.
-- ============================================================================
with criteria_seed(skill_key, rank, sub_level, criterion_type, threshold, variant_match) as (
  values
    -- Tractions
    ('pull_up', 'iron'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 10::numeric, 'dead_hang'),
    ('pull_up', 'iron'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 20::numeric, 'dead_hang'),
    ('pull_up', 'iron'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 30::numeric, 'dead_hang'),
    ('pull_up', 'bronze'::skill_rank, 1, 'reps'::skill_criterion_type, 1::numeric, 'strict'),
    ('pull_up', 'bronze'::skill_rank, 2, 'reps'::skill_criterion_type, 3::numeric, 'strict'),
    ('pull_up', 'bronze'::skill_rank, 3, 'reps'::skill_criterion_type, 6::numeric, 'strict'),
    ('pull_up', 'silver'::skill_rank, 1, 'reps'::skill_criterion_type, 8::numeric, 'strict'),
    ('pull_up', 'silver'::skill_rank, 2, 'reps'::skill_criterion_type, 10::numeric, 'strict'),
    ('pull_up', 'silver'::skill_rank, 3, 'reps'::skill_criterion_type, 12::numeric, 'strict'),
    ('pull_up', 'gold'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'weighted_10pct'),
    ('pull_up', 'gold'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'weighted_20pct'),
    ('pull_up', 'gold'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'archer'),
    ('pull_up', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'one_arm_band_strong'),
    ('pull_up', 'master'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'one_arm_band_light'),
    ('pull_up', 'master'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'one_arm_strict'),

    -- Muscle-up
    ('muscle_up', 'iron'::skill_rank, 1, 'reps'::skill_criterion_type, 3::numeric, 'chest_to_bar'),
    ('muscle_up', 'iron'::skill_rank, 2, 'reps'::skill_criterion_type, 5::numeric, 'chest_to_bar'),
    ('muscle_up', 'iron'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'negative'),
    ('muscle_up', 'bronze'::skill_rank, 1, 'reps'::skill_criterion_type, 1::numeric, 'kipping'),
    ('muscle_up', 'bronze'::skill_rank, 2, 'reps'::skill_criterion_type, 3::numeric, 'kipping'),
    ('muscle_up', 'bronze'::skill_rank, 3, 'reps'::skill_criterion_type, 5::numeric, 'kipping'),
    ('muscle_up', 'silver'::skill_rank, 1, 'reps'::skill_criterion_type, 1::numeric, 'strict'),
    ('muscle_up', 'silver'::skill_rank, 2, 'reps'::skill_criterion_type, 3::numeric, 'strict'),
    ('muscle_up', 'silver'::skill_rank, 3, 'reps'::skill_criterion_type, 5::numeric, 'strict'),
    ('muscle_up', 'gold'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'strict_weighted_5pct'),
    ('muscle_up', 'gold'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'strict_weighted_10pct'),
    ('muscle_up', 'gold'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'strict_weighted_15pct'),
    ('muscle_up', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'one_arm_band_strong'),
    ('muscle_up', 'master'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'one_arm_band_light'),
    ('muscle_up', 'master'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'one_arm'),

    -- Handstand / HSPU
    ('hspu', 'iron'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 10::numeric, 'wall'),
    ('hspu', 'iron'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 20::numeric, 'wall'),
    ('hspu', 'iron'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 45::numeric, 'wall'),
    ('hspu', 'bronze'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'freestanding'),
    ('hspu', 'bronze'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'freestanding'),
    ('hspu', 'bronze'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'freestanding'),
    ('hspu', 'silver'::skill_rank, 1, 'reps'::skill_criterion_type, 1::numeric, 'wall'),
    ('hspu', 'silver'::skill_rank, 2, 'reps'::skill_criterion_type, 3::numeric, 'wall'),
    ('hspu', 'silver'::skill_rank, 3, 'reps'::skill_criterion_type, 6::numeric, 'wall'),
    ('hspu', 'gold'::skill_rank, 1, 'reps'::skill_criterion_type, 1::numeric, 'freestanding'),
    ('hspu', 'gold'::skill_rank, 2, 'reps'::skill_criterion_type, 3::numeric, 'freestanding'),
    ('hspu', 'gold'::skill_rank, 3, 'reps'::skill_criterion_type, 5::numeric, 'freestanding'),
    ('hspu', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'one_arm_assisted'),
    ('hspu', 'master'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 5::numeric, 'one_arm_hold'),
    ('hspu', 'master'::skill_rank, 3, 'reps'::skill_criterion_type, 1::numeric, 'one_arm'),

    -- L-sit / V-sit
    ('l_sit', 'iron'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'tuck'),
    ('l_sit', 'iron'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('l_sit', 'iron'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'tuck'),
    ('l_sit', 'bronze'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'one_leg'),
    ('l_sit', 'bronze'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'one_leg'),
    ('l_sit', 'bronze'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'one_leg'),
    ('l_sit', 'silver'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'full'),
    ('l_sit', 'silver'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'full'),
    ('l_sit', 'silver'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'full'),
    ('l_sit', 'gold'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'v_sit'),
    ('l_sit', 'gold'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'v_sit'),
    ('l_sit', 'gold'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 15::numeric, 'v_sit'),
    ('l_sit', 'master'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 3::numeric, 'manna_tuck'),
    ('l_sit', 'master'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 3::numeric, 'manna_one_leg'),
    ('l_sit', 'master'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 2::numeric, 'manna_full'),

    -- Front lever
    ('front_lever', 'iron'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'tuck'),
    ('front_lever', 'iron'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('front_lever', 'iron'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'tuck'),
    ('front_lever', 'bronze'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'advanced_tuck'),
    ('front_lever', 'bronze'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'advanced_tuck'),
    ('front_lever', 'bronze'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'advanced_tuck'),
    ('front_lever', 'silver'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'one_leg'),
    ('front_lever', 'silver'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'one_leg'),
    ('front_lever', 'silver'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 15::numeric, 'one_leg'),
    ('front_lever', 'gold'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'straddle'),
    ('front_lever', 'gold'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 5::numeric, 'full'),
    ('front_lever', 'gold'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 10::numeric, 'full'),
    ('front_lever', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'one_arm_assisted_tuck'),
    ('front_lever', 'master'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'one_arm_straddle'),
    ('front_lever', 'master'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 3::numeric, 'one_arm_full'),

    -- Back lever
    ('back_lever', 'iron'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'tuck'),
    ('back_lever', 'iron'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('back_lever', 'iron'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'tuck'),
    ('back_lever', 'bronze'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'advanced_tuck'),
    ('back_lever', 'bronze'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'advanced_tuck'),
    ('back_lever', 'bronze'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'advanced_tuck'),
    ('back_lever', 'silver'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'straddle'),
    ('back_lever', 'silver'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'straddle'),
    ('back_lever', 'silver'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 15::numeric, 'straddle'),
    ('back_lever', 'gold'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'full'),
    ('back_lever', 'gold'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'full'),
    ('back_lever', 'gold'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 15::numeric, 'full'),
    ('back_lever', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'one_arm_assisted_tuck'),
    ('back_lever', 'master'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'one_arm_straddle'),
    ('back_lever', 'master'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 3::numeric, 'one_arm_full'),

    -- Planche
    ('planche', 'iron'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'tuck'),
    ('planche', 'iron'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('planche', 'iron'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'tuck'),
    ('planche', 'bronze'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'advanced_tuck'),
    ('planche', 'bronze'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'advanced_tuck'),
    ('planche', 'bronze'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 20::numeric, 'advanced_tuck'),
    ('planche', 'silver'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 5::numeric, 'straddle'),
    ('planche', 'silver'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 10::numeric, 'straddle'),
    ('planche', 'silver'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 15::numeric, 'straddle'),
    ('planche', 'gold'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 3::numeric, 'full'),
    ('planche', 'gold'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 5::numeric, 'full'),
    ('planche', 'gold'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 10::numeric, 'full'),
    ('planche', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'pushup_straddle'),
    ('planche', 'master'::skill_rank, 2, 'reps'::skill_criterion_type, 1::numeric, 'pushup_full'),
    ('planche', 'master'::skill_rank, 3, 'reps'::skill_criterion_type, 3::numeric, 'pushup_full'),

    -- Human flag
    ('human_flag', 'iron'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 3::numeric, 'tuck'),
    ('human_flag', 'iron'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 5::numeric, 'tuck'),
    ('human_flag', 'iron'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 10::numeric, 'tuck'),
    ('human_flag', 'bronze'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 3::numeric, 'one_leg'),
    ('human_flag', 'bronze'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 5::numeric, 'one_leg'),
    ('human_flag', 'bronze'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 10::numeric, 'one_leg'),
    ('human_flag', 'silver'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 3::numeric, 'straddle'),
    ('human_flag', 'silver'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 5::numeric, 'straddle'),
    ('human_flag', 'silver'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 10::numeric, 'straddle'),
    ('human_flag', 'gold'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 3::numeric, 'full'),
    ('human_flag', 'gold'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 5::numeric, 'full'),
    ('human_flag', 'gold'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 10::numeric, 'full'),
    ('human_flag', 'master'::skill_rank, 1, 'hold_seconds'::skill_criterion_type, 15::numeric, 'full'),
    ('human_flag', 'master'::skill_rank, 2, 'hold_seconds'::skill_criterion_type, 20::numeric, 'full'),
    ('human_flag', 'master'::skill_rank, 3, 'hold_seconds'::skill_criterion_type, 30::numeric, 'full'),

    -- Pistol squat
    ('pistol_squat', 'iron'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'assisted_two_hands'),
    ('pistol_squat', 'iron'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'assisted_one_hand'),
    ('pistol_squat', 'iron'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'assisted_band'),
    ('pistol_squat', 'bronze'::skill_rank, 1, 'reps'::skill_criterion_type, 1::numeric, 'full'),
    ('pistol_squat', 'bronze'::skill_rank, 2, 'reps'::skill_criterion_type, 3::numeric, 'full'),
    ('pistol_squat', 'bronze'::skill_rank, 3, 'reps'::skill_criterion_type, 6::numeric, 'full'),
    ('pistol_squat', 'silver'::skill_rank, 1, 'reps'::skill_criterion_type, 8::numeric, 'full'),
    ('pistol_squat', 'silver'::skill_rank, 2, 'reps'::skill_criterion_type, 10::numeric, 'full'),
    ('pistol_squat', 'silver'::skill_rank, 3, 'reps'::skill_criterion_type, 12::numeric, 'full'),
    ('pistol_squat', 'gold'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'weighted_10pct'),
    ('pistol_squat', 'gold'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'weighted_20pct'),
    ('pistol_squat', 'gold'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'weighted_30pct'),
    ('pistol_squat', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'shrimp_assisted'),
    ('pistol_squat', 'master'::skill_rank, 2, 'reps'::skill_criterion_type, 1::numeric, 'shrimp'),
    ('pistol_squat', 'master'::skill_rank, 3, 'reps'::skill_criterion_type, 5::numeric, 'shrimp'),

    -- Dragon flag
    ('dragon_flag', 'iron'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'assisted_high_bend'),
    ('dragon_flag', 'iron'::skill_rank, 2, 'variant'::skill_criterion_type, null, 'assisted_mid_bend'),
    ('dragon_flag', 'iron'::skill_rank, 3, 'variant'::skill_criterion_type, null, 'assisted_low_bend'),
    ('dragon_flag', 'bronze'::skill_rank, 1, 'reps'::skill_criterion_type, 1::numeric, 'full'),
    ('dragon_flag', 'bronze'::skill_rank, 2, 'reps'::skill_criterion_type, 3::numeric, 'full'),
    ('dragon_flag', 'bronze'::skill_rank, 3, 'reps'::skill_criterion_type, 6::numeric, 'full'),
    ('dragon_flag', 'silver'::skill_rank, 1, 'reps'::skill_criterion_type, 8::numeric, 'full'),
    ('dragon_flag', 'silver'::skill_rank, 2, 'reps'::skill_criterion_type, 10::numeric, 'full'),
    ('dragon_flag', 'silver'::skill_rank, 3, 'reps'::skill_criterion_type, 12::numeric, 'full'),
    ('dragon_flag', 'gold'::skill_rank, 1, 'reps'::skill_criterion_type, 5::numeric, 'negative_3s'),
    ('dragon_flag', 'gold'::skill_rank, 2, 'reps'::skill_criterion_type, 5::numeric, 'negative_5s'),
    ('dragon_flag', 'gold'::skill_rank, 3, 'reps'::skill_criterion_type, 8::numeric, 'negative_5s'),
    ('dragon_flag', 'master'::skill_rank, 1, 'variant'::skill_criterion_type, null, 'one_leg_assisted'),
    ('dragon_flag', 'master'::skill_rank, 2, 'reps'::skill_criterion_type, 1::numeric, 'one_leg'),
    ('dragon_flag', 'master'::skill_rank, 3, 'reps'::skill_criterion_type, 3::numeric, 'one_leg')
)
insert into skill_tier_criteria (skill_tier_id, criterion_type, threshold, variant_match)
select st.id, c.criterion_type, c.threshold, c.variant_match
from criteria_seed c
join skills s on s.key = c.skill_key
join skill_tiers st on st.skill_id = s.id and st.rank = c.rank and st.sub_level = c.sub_level;
