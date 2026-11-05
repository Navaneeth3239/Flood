/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        severity: {
          normal: {
            DEFAULT: '#10B981', // Emerald 500
            light: '#D1FAE5',
            dark: '#065F46',
            text: '#047857'
          },
          watch: {
            DEFAULT: '#F59E0B', // Amber 500
            light: '#FEF3C7',
            dark: '#92400E',
            text: '#B45309'
          },
          warning: {
            DEFAULT: '#F97316', // Orange 500
            light: '#FFEDD5',
            dark: '#9A3412',
            text: '#C2410C'
          },
          danger: {
            DEFAULT: '#EF4444', // Red 500
            light: '#FEE2E2',
            dark: '#991B1B',
            text: '#B91C1C'
          },
          unknown: {
            DEFAULT: '#6B7280', // Gray 500
            light: '#F3F4F6',
            dark: '#374151',
            text: '#4B5563'
          }
        },
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          500: '#0284C7',
          600: '#0369A1',
          700: '#075985',
          800: '#0C4A6E',
          900: '#082F49',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
        malayalam: ['"Noto Sans Malayalam"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
