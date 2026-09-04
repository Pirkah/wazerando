/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rando: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        waze: {
          blue: '#3399FF',
          yellow: '#FFC837',
          orange: '#FF7700',
          red: '#FF3B30',
          purple: '#8E44AD',
        }
      },
      boxShadow: {
        'hud': '0 8px 30px rgba(0, 0, 0, 0.25)',
        'float': '0 10px 38px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
