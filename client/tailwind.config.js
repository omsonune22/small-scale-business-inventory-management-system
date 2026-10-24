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
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#ced9fd',
          300: '#a3b8fc',
          400: '#728ff9',
          500: '#4f6bf5',
          600: '#384ceb',
          700: '#2c3ad4',
          800: '#2731ac',
          900: '#242e88',
          950: '#151b54',
        }
      }
    },
  },
  plugins: [],
}
