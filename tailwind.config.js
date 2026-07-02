/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta da Agrosintropia — verdes como cor principal, neutros para respiro.
        // Ajuste estes tons aqui caso a identidade visual mude.
        agro: {
          50: '#f2f8f1',
          100: '#e0efdd',
          200: '#c2dfbc',
          300: '#97c78d',
          400: '#66a858',
          500: '#438a36',
          600: '#316e28',
          700: '#285821',
          800: '#22461d',
          900: '#1d3a1a',
          950: '#0d1f0c',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
