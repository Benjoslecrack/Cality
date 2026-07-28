// Logique pure du streak calendrier, découplée de Supabase/React Query pour
// rester directement testable (cf. skillRanks.ts pour le même principe).

// Lundi de la semaine calendaire (lundi-dimanche) contenant `date`.
export function mondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=dimanche, 1=lundi, ..., 6=samedi
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Le streak reste actif tant qu'aucune semaine calendaire complète ne s'est
// écoulée sans séance faite : un simple jour de repos ne le casse pas, une
// semaine entière blanche oui. 0 semaine d'écart (dernière séance cette
// semaine) ou 1 (semaine précédente, pas de trou) -> actif. 2+ -> cassé.
export function isStreakActive(mostRecentDoneDate: Date | null, today: Date): boolean {
  if (!mostRecentDoneDate) return false;
  const lastActiveWeekStart = mondayOfWeek(mostRecentDoneDate);
  const currentWeekStart = mondayOfWeek(today);
  const weeksBetween = Math.round((currentWeekStart.getTime() - lastActiveWeekStart.getTime()) / WEEK_MS);
  return weeksBetween <= 1;
}
