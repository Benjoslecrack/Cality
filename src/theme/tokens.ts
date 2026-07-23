// Design tokens — source de vérité pour tout ce qui n'est pas exprimable en
// classe NativeWind (color props de composants RN, LinearGradient, icônes).
// Les valeurs de COLORS doivent rester identiques à celles de tailwind.config.js
// (dupliquées volontairement : tailwind.config.js est chargé en CommonJS pur par
// l'outillage Metro/Tailwind, indépendamment de ce module TypeScript).

export const COLORS = {
  bgBase: '#14171A',
  bgSurface: '#1E2226',
  textPrimary: '#EDEDE6',
  textMuted: '#8A9198',
  accent: '#FF5A1F',
  accentDim: '#7A3418',
  // Texte porté PAR un fond accent plein (bouton CTA, badge rempli) : le blanc
  // ne passe pas le contraste AA en texte courant sur #FF5A1F (~3.1:1). Le
  // charbon de fond, lui, passe large (~5.8:1) — et le duo orange/charbon
  // évoque directement la signalétique chantier (barres, palettes).
  onAccent: '#14171A',
} as const;

export const FONT_FAMILY = {
  // Display : titres, libellés de section, hero — carrure condensée.
  displayRegular: 'BarlowCondensed_500Medium',
  displaySemibold: 'BarlowCondensed_600SemiBold',
  displayBold: 'BarlowCondensed_700Bold',
  // Corps de texte : lisible, neutre.
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  // Données chiffrées : charges, reps, temps de maintien, chrono.
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

// Rayons de coin utilisés de façon cohérente dans toute l'app.
export const RADIUS = {
  card: 16,
  control: 12,
  pill: 999,
} as const;

// Zone tactile minimale (WCAG 2.5.5 / Apple HIG) pour tout élément pressable.
export const MIN_TOUCH_TARGET = 44;

// Élévation des cartes : un flou doux plutôt qu'un filet de contour — les
// surfaces se distinguent par la lumière, pas par une ligne (béton/acier).
export const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 4,
} as const;
