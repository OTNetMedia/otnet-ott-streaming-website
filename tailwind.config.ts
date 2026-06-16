import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        card: '#141414',
        muted: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.10)',
        primary: '#E50914',
        accent: '#F3C61B',
        text: {
          primary: '#FFFFFF',
          secondary: 'rgba(255,255,255,0.72)',
          tertiary: 'rgba(255,255,255,0.50)',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'prime': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 0 2px #00A8E1, 0 8px 24px rgba(0,168,225,0.35)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 400ms ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
