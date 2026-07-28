-- Préférences de notifications locales (rappel de séance, streak, palier/
-- record). Pas de nouvelle table : ce sont des réglages au même titre que
-- `goals`, déjà sur profiles. Pas de RLS supplémentaire nécessaire, les
-- policies profiles_* de 0001_init.sql couvrent déjà toutes les colonnes.
alter table profiles
  add column notify_session_reminder boolean not null default true,
  add column notify_streak boolean not null default true,
  add column notify_milestone boolean not null default true,
  -- Heure locale (pas de fuseau : interprétée côté app comme l'heure du
  -- téléphone au moment de la planification), pas un type `time` Postgres
  -- pour éviter les questions de sérialisation/fuseau côté client.
  add column session_reminder_hour smallint not null default 9
    check (session_reminder_hour between 0 and 23),
  add column session_reminder_minute smallint not null default 0
    check (session_reminder_minute between 0 and 59);
