/** @type {import('tailwindcss').Config} */
// Palette — doit rester identique à src/theme/tokens.ts (voir commentaire
// là-bas : les deux fichiers ne peuvent pas s'importer l'un l'autre car
// celui-ci est chargé en CommonJS pur par l'outillage Tailwind/Metro).
//
// Identité pixel art 16-bit / synthwave Miami Vice.
const COLORS = {
  background: '#17092B', // bg-night
  surface: '#23103F', // bg-surface
  text: '#FDF6EC', // text-primary
  textMuted: '#9C8CC2', // text-muted (lavande grisée)
  accent: '#FF2E92', // neon-magenta — CTA, records, éléments actifs
  accentDim: '#7A1749', // magenta assourdi — remplissages/bordures secondaires
  accentCyan: '#00F0FF', // neon-cyan — progression, navigation, liens
  sunset: '#FF6B35', // horizon, dégradé signature
  onAccent: '#17092B', // texte sur fond accent plein
  // Noms génériques utilisés par plusieurs écrans pour l'état "actif/sélectionné"
  // et les bordures de carte — équivalents directs de accent/accentDim.
  primary: '#FF2E92',
  primaryMuted: '#7A1749',
  // 70% et non 25% : à 2px plein, un filet trop pâle tombe sous le seuil de
  // contraste non-textuel AA (3:1) pour délimiter une carte/un contrôle.
  border: 'rgba(156, 140, 194, 0.7)',
};

module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: COLORS,
      fontFamily: {
        display: ['PixelifySans_600SemiBold'],
        displayBold: ['PixelifySans_700Bold'],
        body: ['Inter_400Regular'],
        bodyMedium: ['Inter_500Medium'],
        bodySemibold: ['Inter_600SemiBold'],
        mono: ['PixelifySans_500Medium'],
        monoMedium: ['PixelifySans_600SemiBold'],
        monoBold: ['PixelifySans_700Bold'],
      },
    },
  },
  plugins: [],
};
