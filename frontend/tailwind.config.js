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
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9fe',
          300: '#9ebffe',
          400: '#6d9bfb',
          500: '#4373f7',
          600: '#2851ee',
          700: '#1e3cd6',
          800: '#1c32ae',
          900: '#1c2d89',
          950: '#141d54',
        },
        cyber: {
          cyan: '#06b6d4',
          teal: '#14b8a6',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
        navy: {
          800: '#0f172a',
          850: '#0b1325',
          900: '#080e1d',
          950: '#040711',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        risk: {
          critical: '#f43f5e',
          high: '#f97316',
          medium: '#eab308',
          low: '#10b981',
          info: '#06b6d4',
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
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 16px 32px -8px rgba(30, 58, 138, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 20px 40px -8px rgba(15, 23, 42, 0.18), 0 8px 16px -4px rgba(15, 23, 42, 0.08)',
        'glow-brand': '0 0 25px -4px rgba(40, 81, 238, 0.45)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.45)',
        'glow-purple': '0 0 25px -4px rgba(168, 85, 247, 0.45)',
        'glow-danger': '0 0 25px -4px rgba(244, 63, 94, 0.45)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.45)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, rgba(148, 163, 184, 0.12) 1px, transparent 1px)",
        'mesh-glow': "radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%)",
      }
    },
  },
  plugins: [],
}
