/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fbf9',
          100: '#dff7f3',
          200: '#bff0e7',
          300: '#80e0cf',
          400: '#40cfa0',
          500: '#00af9b',
          600: '#009686',
          700: '#007a6b',
          800: '#005f50',
          900: '#004336',
        },
        accent: {
          50:  '#fff6ec',
          100: '#fff0db',
          200: '#ffe0b7',
          300: '#ffd08f',
          400: '#ffb85a',
          500: '#ef8833',
          600: '#d46f2b',
          700: '#b85a22',
          800: '#8f4419',
          900: '#662f11',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(0, 0, 0, 0.1)',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [],
}
