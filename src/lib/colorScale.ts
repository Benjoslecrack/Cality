// Interpolation de couleur pure (pas de dépendance React Native), pour la
// heatmap annuelle : dégradé d'intensité entre deux couleurs déjà définies
// dans le thème plutôt que d'en introduire de nouvelles.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function toHexByte(n: number): string {
  return Math.round(Math.max(0, Math.min(255, n)))
    .toString(16)
    .padStart(2, '0');
}

// t dans [0, 1] : 0 = `from`, 1 = `to`. Valeurs hors bornes clampées.
export function lerpColor(from: string, to: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const r = r1 + (r2 - r1) * clamped;
  const g = g1 + (g2 - g1) * clamped;
  const b = b1 + (b2 - b1) * clamped;
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}
