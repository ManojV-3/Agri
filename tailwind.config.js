/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#F1F8E9',
          100: '#DCEDC8',
          200: '#C5E1A5',
          300: '#AED581',
          400: '#9CCC65',
          500: '#7CB342',
          600: '#558B2F',
          700: '#33691E',
          800: '#2E7D32',
          900: '#1B5E20',
          dark: '#0D380F',
        },
        earth: {
          50: '#EFEBE9',
          100: '#D7CCC8',
          200: '#BCAAA4',
          300: '#A1887F',
          400: '#8D6E63',
          500: '#795548',
          600: '#6D4C41',
          700: '#5D4037',
          800: '#4E342E',
          900: '#3E2723',
        },
        amberGold: {
          DEFAULT: '#F57F17',
          hover: '#E65100',
        }
      },
      fontFamily: {
        kannada: ['"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans Kannada"', 'Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '360px',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      }
    },
  },
  plugins: [],
}
