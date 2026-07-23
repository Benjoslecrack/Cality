-- v2 bloc 3 : RPE structuré (nécessaire pour la suggestion charge/reps).
-- Le champ `notes` existant reste pour les sensations qualitatives en texte
-- libre ; `rpe` est la valeur numérique isolée sur laquelle on peut raisonner.
alter table workout_logs
  add column rpe int check (rpe is null or (rpe between 1 and 10));
