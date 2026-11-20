/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6600',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#2b0e04',
          retro: '#ff6b00',
          amber: '#f59e0b',
        },
        dark: {
          950: '#050505',
          900: '#0a0a0a',
          850: '#0f0f0f',
          800: '#141414',
          750: '#181818',
          700: '#1f1f1f',
          600: '#262626',
          500: '#333333',
        },
        retro: {
          surface: '#121212',
          'surface-hover': '#191919',
          'surface-card': '#141414',
          black: '#0a0a0a',
          border: '#222222',
          'border-subtle': '#1a1a1a',
          orange: '#ff6600',
          'orange-hover': '#ff771a',
          'orange-light': '#ff8833',
          'orange-glow': 'rgba(255, 102, 0, 0.25)',
          muted: '#737373',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'retro': '0 0 20px -3px rgba(255, 102, 0, 0.25)',
        'retro-orange': '0 0 20px -3px rgba(255, 107, 0, 0.25)',
        'retro-orange-sm': '0 0 10px -2px rgba(255, 107, 0, 0.2)',
        'retro-card': '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
        'glow-orange': '0 0 30px rgba(255, 102, 0, 0.2)',
      }
    },
  },
  plugins: [],
};
