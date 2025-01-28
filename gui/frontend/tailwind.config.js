/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
        'mono': ['Fira Code','monospace']
      },
      colors: {
        'primary-purple': '#9d4edd',
        'primary-purple-light': '#b589df',
        'secondary-purple': '#4a1259',
        'secondary-purple-dark': '#2f0a3c',
        'spotify-green': '#1DB954',
        'spotify-green-light': '#1ed760'
      }
    },
  },
  plugins: [],
}