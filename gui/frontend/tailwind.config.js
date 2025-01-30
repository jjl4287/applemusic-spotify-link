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
        'mono': ['Fira Code','monospace'],
        'playfair': ['Playfair Display', 'serif']
      },
      colors: {
        'primary-beige': '#D5C4A1',
        'primary-beige-light': '#E6D5B8',
        'secondary-brown': '#8B7355',
        'secondary-brown-dark': '#5C4033',
        'spotify-green': '#1DB954',
        'spotify-green-light': '#1ed760',
        'backdrop': 'rgba(213, 196, 161, 0.1)',
        'card-bg': 'rgba(230, 213, 184, 0.85)'
      }
    },
  },
  plugins: [],
}