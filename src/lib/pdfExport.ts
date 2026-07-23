import { COLORS } from '../theme/tokens';

export type SkillSummary = {
  label: string;
  latest: { value: number; unit: string } | null;
  weeklyTrend: { label: string; value: number }[];
  unlockedCount: number;
  totalMilestones: number;
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Même logique de représentation que SimpleBarChart (dernier point en accent,
// les autres en gris atténué) : le PDF réutilise la même lecture visuelle
// que l'écran, pas un nouveau système de graphique.
function barChartHtml(points: { label: string; value: number }[]): string {
  if (points.length === 0) {
    return '<p class="empty">Pas encore assez de données pour une tendance.</p>';
  }
  const max = Math.max(...points.map((p) => p.value), 1);
  const bars = points
    .map((point, index) => {
      const heightPct = Math.max((point.value / max) * 100, 4);
      const isLast = index === points.length - 1;
      return `
        <div class="bar-col">
          <div class="bar-value">${point.value}</div>
          <div class="bar${isLast ? ' bar-accent' : ''}" style="height:${heightPct}%"></div>
          <div class="bar-label">${escapeHtml(point.label)}</div>
        </div>`;
    })
    .join('');
  return `<div class="chart">${bars}</div>`;
}

function skillSectionHtml(summary: SkillSummary): string {
  return `
    <section class="card">
      <h2>${escapeHtml(summary.label)}</h2>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">Record</div>
          <div class="stat-value">${summary.latest ? `${summary.latest.value} ${escapeHtml(summary.latest.unit)}` : '—'}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Paliers débloqués</div>
          <div class="stat-value">${summary.unlockedCount}/${summary.totalMilestones}</div>
        </div>
      </div>
      <div class="chart-title">Tendance (3 mois, par semaine)</div>
      ${barChartHtml(summary.weeklyTrend)}
    </section>`;
}

// Genère le HTML imprimé en PDF via expo-print. Les polices Google Fonts de
// l'app ne sont pas embarquées ici (coût disproportionné pour un export) :
// on reprend seulement la palette de couleurs (theme/tokens.ts) et le même
// principe de graphique en barres, avec une pile de polices système neutre.
export function buildProgressSummaryHtml(summaries: SkillSummary[], generatedAt = new Date()): string {
  const dateLabel = generatedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const sections = summaries.map(skillSectionHtml).join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { background: ${COLORS.bgBase}; color: ${COLORS.textPrimary}; font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 0; padding: 32px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .subtitle { color: ${COLORS.textMuted}; font-size: 12px; margin: 0 0 24px; }
  .card { background: ${COLORS.bgSurface}; border-radius: 16px; padding: 20px; margin-bottom: 16px; page-break-inside: avoid; }
  h2 { font-size: 18px; margin: 0 0 12px; }
  .stat-row { display: flex; gap: 24px; margin-bottom: 16px; }
  .stat-label { color: ${COLORS.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-value { font-family: 'Courier New', monospace; font-size: 20px; margin-top: 2px; }
  .chart-title { color: ${COLORS.textMuted}; font-size: 11px; margin-bottom: 8px; }
  .chart { display: flex; align-items: flex-end; gap: 6px; height: 120px; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
  .bar-value { font-size: 9px; color: ${COLORS.textMuted}; margin-bottom: 2px; font-family: 'Courier New', monospace; }
  .bar { width: 100%; background: rgba(138, 145, 152, 0.25); border-radius: 4px 4px 0 0; }
  .bar-accent { background: ${COLORS.accent}; }
  .bar-label { font-size: 9px; color: ${COLORS.textMuted}; margin-top: 4px; }
  .empty { color: ${COLORS.textMuted}; font-size: 12px; }
</style>
</head>
<body>
  <h1>Progression Cality</h1>
  <p class="subtitle">Généré le ${dateLabel}</p>
  ${sections}
</body>
</html>`;
}
