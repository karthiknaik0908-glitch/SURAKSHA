/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        suraksha: {
          black: '#0a0a0a',
          charcoal: '#1a1a1a',
          dark: '#111111',
          card: '#1e1e1e',
          border: '#2a2a2a',
          red: '#dc2626',
          'red-dark': '#991b1b',
          'red-light': '#ef4444',
          accent: '#f97316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
