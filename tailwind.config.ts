import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        garden: ['var(--font-cormorant)', 'serif'],
        script: ['var(--font-dancing)', 'cursive'],
        display: ['var(--font-display)', 'serif']
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        },
        drift: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0px)' }
        }
      },
      animation: {
        glow: 'glowPulse 4s ease-in-out infinite',
        drift: 'drift 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
