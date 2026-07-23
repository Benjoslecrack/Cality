// Utilitaires de calendrier basés sur l'objet Date natif (pas de lib externe,
// le besoin est simple : grille mensuelle + formatage en français).

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayDateKey(): string {
  return toDateKey(new Date());
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Lundi de la semaine contenant `date` (convention utilisée par la grille du
// calendrier : la semaine commence le lundi).
export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
  return result;
}

export function shortDateLabel(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function monthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function weekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

export function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} ${MONTH_LABELS[date.getMonth()].toLowerCase()}`;
}

// Grille de 6 semaines (42 jours) couvrant le mois, en commençant le lundi.
// Les jours hors mois sont conservés (utile pour l'affichage grisé) avec `inMonth: false`.
export function getMonthGrid(monthDate: Date): { date: Date; inMonth: boolean }[] {
  const firstOfMonth = startOfMonth(monthDate);
  // getDay() renvoie 0 pour dimanche ; on veut un offset "lundi = 0".
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return { date, inMonth: date.getMonth() === monthDate.getMonth() };
  });
}
