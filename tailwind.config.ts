// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          900: '#140018',
          800: '#18011E',
          700: '#1D0626',
          600: '#220A2E',
          500: '#2A0E3B',
        },
        brand: {
          cyan: '#3DE0FF',
          purple: '#7B61FF',
          magenta: '#9B25FF',
          green: '#00FF87',
        },
      },
            backgroundImage: {
              'brand-header':
                'linear-gradient(90deg, #3DE0FF 0%, #7B61FF 45%, #9B25FF 100%)',
            },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.35), 0 4px 8px rgba(0,0,0,0.25)',
        soft: '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 16px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        '2xl': '1.1rem',
      },
      fontFamily: {
        sans: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
