import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config = {
  darkMode: "class",
  content: [
  './pages/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
    },
  },
  plugins: [animate],
} satisfies Config

export default config