/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdeff',
          300: '#8ec8ff',
          400: '#58a7fb',
          500: '#2f82f6',
          600: '#1b63eb',
          700: '#154ec8',
          800: '#1740a1',
          900: '#18387f',
          950: '#11234e',
        },
        navy: {
          800: '#0f172a',
          850: '#0b1325',
          900: '#080e1d',
          950: '#040711',
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        risk: {
          critical: '#e11d48',
          high: '#ea580c',
          medium: '#d97706',
          low: '#059669',
          info: '#0284c7',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 8px -4px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 6px 12px -6px rgba(15, 23, 42, 0.06)',
        'glow-brand': '0 0 20px -3px rgba(37, 99, 235, 0.28)',
        'glow-danger': '0 0 20px -3px rgba(225, 29, 72, 0.28)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}
