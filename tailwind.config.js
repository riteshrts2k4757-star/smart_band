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
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
          900: '#064e3b',
        },
        navy: {
          800: '#0f172a',
          900: '#0b0f19',
          950: '#05070e',
        },
        accent: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-green': 'glowGreen 1.5s ease-in-out infinite alternate',
        'glow-red': 'glowRed 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowGreen: {
          '0%': { boxShadow: '0 0 5px #10b981, 0 0 10px #10b981' },
          '100%': { boxShadow: '0 0 20px #10b981, 0 0 35px #34d399, 0 0 50px #6ee7b7' },
        },
        glowRed: {
          '0%': { boxShadow: '0 0 5px #ef4444, 0 0 10px #ef4444' },
          '100%': { boxShadow: '0 0 20px #ef4444, 0 0 35px #f87171, 0 0 50px #fca5a5' },
        }
      }
    },
  },
  plugins: [],
}

