/** @type {import('tailwindcss').Config} */
// Palette — doit rester identique à src/theme/tokens.ts (voir commentaire
// là-bas : les deux fichiers ne peuvent pas s'importer l'un l'autre car
// celui-ci est chargé en CommonJS pur par l'outillage Tailwind/Metro).
const COLORS = {
  background: '#14171A', // bg-base
  surface: '#1E2226', // bg-surface
  text: '#EDEDE6', // text-primary
  textMuted: '#8A9198', // text-muted
  accent: '#FF5A1F',
  accentDim: '#7A3418',
  onAccent: '#14171A', // texte sur fond accent plein (contraste AA ~5.8:1 vs ~3.1:1 en blanc)
};

// Ponts temporaires vers l'ancienne palette générique, le temps de refondre
// chaque écran un par un (cf. demande de refonte progressive). Objectif :
// ne pas casser visuellement les écrans pas encore migrés. À supprimer une
// fois tous les écrans passés sur COLORS ci-dessus.
const LEGACY_BRIDGE_COLORS = {
  primary: COLORS.accent,
  primaryMuted: COLORS.accentDim,
  surfaceAlt: '#262B30',
  border: 'rgba(138, 145, 152, 0.25)', // text-muted à faible opacité, pas une teinte inventée
  success: COLORS.accent,
  warning: COLORS.textMuted,
};

module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: { ...COLORS, ...LEGACY_BRIDGE_COLORS },
      fontFamily: {
        display: ['BarlowCondensed_600SemiBold'],
        displayBold: ['BarlowCondensed_700Bold'],
        body: ['Inter_400Regular'],
        bodyMedium: ['Inter_500Medium'],
        bodySemibold: ['Inter_600SemiBold'],
        mono: ['JetBrainsMono_400Regular'],
        monoMedium: ['JetBrainsMono_500Medium'],
        monoBold: ['JetBrainsMono_700Bold'],
      },
    },
  },
  plugins: [],
};
