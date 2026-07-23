-- v2 bloc 1 : durée de repos configurable par exercice planifié.
-- NULL = utilise la valeur par défaut de l'app (90s).
alter table session_exercises
  add column target_rest_seconds int;
