/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/views/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Desktop V2.1 : ≥ 1200 px (rails latéraux)
        desk: '1200px',
      },
      // Palette V1 (bleu #103778 + orange #FF5A33) appliquée à la structure V2.1
      colors: {
        brand: {
          DEFAULT: '#103778',
          50: '#E6ECF6',
          100: '#CCD9ED',
          200: '#99B3DB',
          500: '#3367B7',
          600: '#103778',
          700: '#0D2C60',
        },
        // Actions clés (« + Publier », « Payer », « Afficher N offres »)
        accent: {
          DEFAULT: '#FF5A33',
          50: '#FFECE6',
          100: '#FFD9CC',
          600: '#E5411A',
          700: '#B33315',
        },
        navy: {
          DEFAULT: '#0A2148',
          light: '#0D2C60',
        },
        surface: '#F3F6FA',
        perso: { DEFAULT: '#7C3AED', 50: '#F3EEFF' },
        service: { DEFAULT: '#0D9488', 50: '#E6F7F5' },
        trust: { DEFAULT: '#16A34A', 50: '#E8F7EE' },
        caution: { DEFAULT: '#D97706', 50: '#FEF7E6' },
      },
    },
  },
  plugins: [],
}
