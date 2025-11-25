/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00ACC1',
          dark: '#00838F',
          light: '#26C6DA',
        },
        secondary: {
          DEFAULT: '#FF6F00',
          dark: '#E65100',
          light: '#FF8F00',
        },
        success: '#43A047',
        danger: '#E53935',
        warning: '#FFA726',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#212121',
          secondary: '#757575',
        },
        border: '#E0E0E0',
      },
    },
  },
  plugins: [],
}
