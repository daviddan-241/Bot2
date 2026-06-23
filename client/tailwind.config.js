/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c4d2ff',
          300: '#a2b4ff',
          400: '#7c8fff',
          500: '#5c67ff',
          600: '#4040ff',
          700: '#3232e0',
          800: '#2626b8',
          900: '#1a1a8c',
          950: '#0d0d5e',
        },
        surface: {
          DEFAULT: '#0A0A14',
          50:  '#111120',
          100: '#16162a',
          200: '#1c1c35',
          300: '#232340',
          400: '#2a2a4d',
        }
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.18)',
        card: '0 2px 12px rgba(0,0,0,0.22)',
        glow: '0 0 0 1px rgba(92,103,255,.3), 0 12px 40px rgba(92,103,255,.2)',
        'glow-sm': '0 0 0 1px rgba(92,103,255,.2), 0 4px 16px rgba(92,103,255,.15)',
        inner: 'inset 0 1px 0 rgba(255,255,255,.06)',
      },
      backgroundImage: {
        'grad-brand': 'linear-gradient(135deg, #5c67ff 0%, #7c3aed 100%)',
        'grad-dark': 'linear-gradient(180deg, #0A0A14 0%, #12121f 100%)',
        'grad-card': 'linear-gradient(145deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        }
      }
    }
  },
  plugins: []
};
