import {
  addMonths,
  formatDayLabel,
  getMonthGrid,
  isSameDay,
  monthLabel,
  shortDateLabel,
  startOfMonth,
  startOfWeek,
  toDateKey,
  weekdayLabels,
} from './dateUtils';

describe('toDateKey', () => {
  it('formate une date en YYYY-MM-DD avec zéros de padding', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 10, 23))).toBe('2026-11-23');
  });
});

describe('isSameDay', () => {
  it('compare deux dates au jour près, en ignorant l\'heure', () => {
    expect(isSameDay(new Date(2026, 6, 23, 8, 0), new Date(2026, 6, 23, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 6, 23), new Date(2026, 6, 24))).toBe(false);
  });
});

describe('startOfMonth', () => {
  it('renvoie le 1er du mois', () => {
    expect(toDateKey(startOfMonth(new Date(2026, 6, 23)))).toBe('2026-07-01');
  });
});

describe('startOfWeek', () => {
  it('renvoie le lundi de la semaine (convention lundi = début)', () => {
    // 23 juillet 2026 est un jeudi.
    expect(toDateKey(startOfWeek(new Date(2026, 6, 23)))).toBe('2026-07-20');
  });

  it('renvoie la même date pour un lundi', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 6, 20)))).toBe('2026-07-20');
  });

  it('gère un dimanche (fin de semaine ISO)', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 6, 26)))).toBe('2026-07-20');
  });
});

describe('addMonths', () => {
  it('avance au 1er du mois suivant', () => {
    expect(toDateKey(addMonths(new Date(2026, 6, 23), 1))).toBe('2026-08-01');
  });

  it('recule au 1er du mois précédent', () => {
    expect(toDateKey(addMonths(new Date(2026, 6, 23), -1))).toBe('2026-06-01');
  });

  it('gère le changement d\'année', () => {
    expect(toDateKey(addMonths(new Date(2026, 11, 15), 1))).toBe('2027-01-01');
  });
});

describe('shortDateLabel', () => {
  it('formate en JJ/MM', () => {
    expect(shortDateLabel(new Date(2026, 6, 5))).toBe('05/07');
  });
});

describe('monthLabel', () => {
  it('formate en français avec l\'année', () => {
    expect(monthLabel(new Date(2026, 6, 1))).toBe('Juillet 2026');
  });
});

describe('weekdayLabels', () => {
  it('renvoie les 7 jours abrégés en commençant par lundi', () => {
    expect(weekdayLabels()).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
  });
});

describe('formatDayLabel', () => {
  it('formate une clé de date en libellé long capitalisé', () => {
    // 23 juillet 2026 est un jeudi.
    expect(formatDayLabel('2026-07-23')).toBe('Jeudi 23 juillet');
  });
});

describe('getMonthGrid', () => {
  it('renvoie toujours 42 jours (6 semaines)', () => {
    expect(getMonthGrid(new Date(2026, 6, 1))).toHaveLength(42);
  });

  it('commence un lundi et marque les jours hors mois', () => {
    const grid = getMonthGrid(new Date(2026, 6, 1));
    expect(grid[0].date.getDay()).toBe(1); // lundi
    expect(grid[0].inMonth).toBe(false); // 29 juin, hors juillet
    const firstOfMonth = grid.find((d) => toDateKey(d.date) === '2026-07-01');
    expect(firstOfMonth?.inMonth).toBe(true);
  });

  it('inclut tous les jours du mois demandé', () => {
    const grid = getMonthGrid(new Date(2026, 6, 1));
    const daysInMonth = grid.filter((d) => d.inMonth);
    expect(daysInMonth).toHaveLength(31); // juillet a 31 jours
  });
});
