// Design tokens — source de vérité pour tout ce qui n'est pas exprimable en
// classe NativeWind (color props de composants RN, LinearGradient, icônes).
// Les valeurs de COLORS doivent rester identiques à celles de tailwind.config.js
// (dupliquées volontairement : tailwind.config.js est chargé en CommonJS pur par
// l'outillage Metro/Tailwind, indépendamment de ce module TypeScript).
//
// Identité pixel art 16-bit / synthwave Miami Vice : nuit violette profonde,
// horizon néon magenta → orange → cyan.

export const COLORS = {
  bgNight: '#17092B',
  bgSurface: '#23103F',
  sunsetOrange: '#FF6B35',
  neonMagenta: '#FF2E92',
  neonCyan: '#00F0FF',
  // Magenta assourdi : remplissages/pistes secondaires (ex. piste d'un
  // interrupteur actif, embout de dégradé), jamais un ton inventé à part.
  accentDim: '#7A1749',
  textPrimary: '#FDF6EC',
  textMuted: '#9C8CC2',
  // Texte porté PAR un fond accent plein (bouton CTA, badge rempli) : le fond
  // nuit passe large le contraste AA sur le magenta et le cyan, contrairement
  // au texte primaire clair qui n'y passe pas en texte courant.
  onAccent: '#17092B',
} as const;

// Dégradé signature : coucher de soleil synthwave, à utiliser avec parcimonie
// (fond de hero, écran de passage de rang) — jamais en fond générique.
export const GRADIENT_SUNSET = [COLORS.neonMagenta, COLORS.sunsetOrange, COLORS.neonCyan] as const;

export const FONT_FAMILY = {
  // Pixel : titres, libellés de section, hero, records, chiffres clés — c'est
  // là que l'identité pixel art doit être la plus visible.
  pixelRegular: 'PixelifySans_400Regular',
  pixelMedium: 'PixelifySans_500Medium',
  pixelSemibold: 'PixelifySans_600SemiBold',
  pixelBold: 'PixelifySans_700Bold',
  // Corps de texte : lisible, neutre — descriptions, instructions, usage
  // rapide entre deux séries. Une police pixel intégrale nuirait à la lecture.
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;

// Rayons de coin utilisés de façon cohérente dans toute l'app.
export const RADIUS = {
  card: 16,
  control: 12,
  pill: 999,
} as const;

// Zone tactile minimale (WCAG 2.5.5 / Apple HIG) pour tout élément pressable.
export const MIN_TOUCH_TARGET = 44;

// Élévation des cartes : ombre nette plutôt qu'un flou doux, façon bordure
// d'inventaire pixel art (contour net + ombre portée courte).
export const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.5,
  shadowRadius: 0,
  elevation: 4,
} as const;
