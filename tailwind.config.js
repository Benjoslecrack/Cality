/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Palette sombre par défaut (contexte salle / rue)
        background: '#0B0D10',
        surface: '#16191D',
        surfaceAlt: '#1E2227',
        border: '#2A2F36',
        primary: '#F2545B', // accent (effort / records)
        primaryMuted: '#7A2A2E',
        text: '#F5F6F7',
        textMuted: '#9AA1AA',
        success: '#4CAF7D',
        warning: '#E0A93E',
      },
    },
  },
  plugins: [],
};
