import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B2C4D',
          navyLight: '#123D66',
          navyDark: '#071D33',
          emerald: '#10B981',
          emeraldLight: '#34D399',
          emeraldDark: '#059669',
          cyan: '#06B6D4',
          teal: '#0D9488',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0B2C4D', // Arivsoft Brand Navy
          600: '#071D33', // Deep Brand Navy
          700: '#051627',
          800: '#030E1A',
          900: '#02080F',
        },
        secondary: {
          50: '#f8fafc',
          900: '#0f172a',
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
