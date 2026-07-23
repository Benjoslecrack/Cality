import { buildProgressSummaryHtml, type SkillSummary } from './pdfExport';

const FIXED_DATE = new Date(2026, 6, 23);

function summary(overrides: Partial<SkillSummary> = {}): SkillSummary {
  return {
    label: 'Tractions',
    latest: { value: 12, unit: 'reps' },
    weeklyTrend: [
      { label: '13/07', value: 8 },
      { label: '20/07', value: 12 },
    ],
    unlockedCount: 2,
    totalMilestones: 4,
    ...overrides,
  };
}

describe('buildProgressSummaryHtml', () => {
  it('inclut le libellé du skill, le record et les paliers débloqués', () => {
    const html = buildProgressSummaryHtml([summary()], FIXED_DATE);
    expect(html).toContain('Tractions');
    expect(html).toContain('12 reps');
    expect(html).toContain('2/4');
  });

  it('affiche la date de génération en français', () => {
    const html = buildProgressSummaryHtml([summary()], FIXED_DATE);
    expect(html).toContain('23 juillet 2026');
  });

  it('affiche un message quand la tendance est vide, sans planter', () => {
    const html = buildProgressSummaryHtml([summary({ weeklyTrend: [] })], FIXED_DATE);
    expect(html).toContain('Pas encore assez de données');
  });

  it("affiche un tiret quand il n'y a pas encore de record", () => {
    const html = buildProgressSummaryHtml([summary({ latest: null })], FIXED_DATE);
    expect(html).toContain('—');
  });

  it('échappe le HTML dans les libellés (défense en profondeur)', () => {
    const html = buildProgressSummaryHtml([summary({ label: '<script>alert(1)</script>' })], FIXED_DATE);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('génère une section par skill fourni', () => {
    const html = buildProgressSummaryHtml(
      [summary({ label: 'Tractions' }), summary({ label: 'HSPU' })],
      FIXED_DATE
    );
    expect(html.match(/class="card"/g)).toHaveLength(2);
  });
});
