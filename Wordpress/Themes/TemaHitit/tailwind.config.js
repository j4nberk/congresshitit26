/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.php',
    './patterns/**/*.php',
    './template-parts/**/*.php',
    './form-plugin/**/*.php',
    './reg-check-plugin/**/*.php',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        hititGreen: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        darkBlack: '#050505',
        cardBlack: '#0a0a0a',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #1665341a 1px, transparent 1px), linear-gradient(to bottom, #1665341a 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
