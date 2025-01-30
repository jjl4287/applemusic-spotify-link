/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-purple': '#9d4edd',
        'primary-purple-light': '#b589df',
        'secondary-purple': '#4a1259',
        'secondary-purple-dark': '#2f0a3c',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'mono': ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}