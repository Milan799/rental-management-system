/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          surface: 'rgba(255, 255, 255, 0.05)',
          'surface-hover': 'rgba(255, 255, 255, 0.09)',
          border: 'rgba(255, 255, 255, 0.12)',
          'border-highlight': 'rgba(255, 255, 255, 0.25)',
          dark: 'rgba(15, 23, 42, 0.75)',
        },
        brand: {
          blue: '#0284c7',
          cyan: '#06b6d4',
          emerald: '#10b981',
          purple: '#8b5cf6',
          rose: '#f43f5e',
          amber: '#f59e0b',
          whatsapp: '#25D366'
        }
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-button': 'inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 4px 12px rgba(0, 0, 0, 0.2)',
        'neon-cyan': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'neon-emerald': '0 0 25px -5px rgba(52, 211, 153, 0.4)',
        'soft-card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '32px',
      }
    },
  },
  plugins: [],
}

