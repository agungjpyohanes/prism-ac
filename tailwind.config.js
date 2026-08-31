/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        cosmic: {
          dark: '#050716',
          panel: 'rgba(13, 22, 50, 0.65)',
          border: 'rgba(56, 189, 248, 0.25)',
          glow: '#06b6d4',
          cyan: '#22d3ee',
          violet: '#a855f7',
          pink: '#ec4899'
        }
      },
      boxShadow: {
        'cosmic-card': '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
        'cosmic-glow': '0 0 25px rgba(6, 182, 212, 0.35)',
        'cosmic-pill': '0 0 15px rgba(6, 182, 212, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
      }
    },
  },
  plugins: [],
}