/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Vert de confiance — couleur signature de Noteo
        brand: {
          50: '#E6F7F1',
          100: '#C2ECDD',
          200: '#8FDCC2',
          300: '#5BCBA6',
          400: '#2FBB8E',
          500: '#00A676',
          600: '#00805A',
          700: '#007352',
          800: '#005A40',
          900: '#00402E',
        },
        // Noirs et gris — hiérarchie typographique façon Uber
        ink: {
          DEFAULT: '#0E1116',
          800: '#1C2127',
          700: '#3A4048',
          500: '#6B7280',
          300: '#A8AFB8',
          200: '#D7DBE0',
          100: '#EDEFF2',
          50: '#F7F8FA',
        },
        // Étoiles
        star: '#FFB800',
        // Surfaces (clair / sombre)
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F7F8FA',
          dark: '#0B0D10',
          darkMuted: '#15181D',
        },
      },
      borderRadius: {
        card: '18px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
