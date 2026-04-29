import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // V1 Design System — Elite Performance
        primary: {
          DEFAULT: '#007AFF',
          light: '#4da3ff',
          dark: '#0062cc',
          content: '#ffffff',
        },
        background: {
          light: '#f2f2f7',
          dark: '#000000',
        },
        surface: {
          dark: '#1c1c1e',
          'dark-2': '#2c2c2e',
          'dark-3': '#3a3a3c',
        },
        success: '#34c759',
        warning: '#ff9f0a',
        danger: '#ff3b30',
        info: '#007AFF',

        // Semantic text
        'text-primary': 'rgba(255,255,255,0.90)',
        'text-secondary': 'rgba(255,255,255,0.60)',
        'text-tertiary': 'rgba(255,255,255,0.40)',
        'text-placeholder': 'rgba(255,255,255,0.20)',

        // Glass
        'glass-bg': 'rgba(30, 30, 30, 0.6)',
        'glass-bg-hover': 'rgba(255, 255, 255, 0.08)',
        'glass-bg-active': 'rgba(255, 255, 255, 0.12)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'glass-border-light': 'rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        ios: '0 2px 12px rgba(0, 0, 0, 0.08)',
        float: '0 12px 40px rgba(0, 0, 0, 0.6)',
        'primary-glow': '0 2px 8px rgba(0, 122, 255, 0.3)',
        'primary-glow-lg': '0 4px 16px rgba(0, 122, 255, 0.4)',
        'white-glow': '0 2px 8px rgba(255, 255, 255, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
        xl: '24px',
        '2xl': '40px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'fade-in-down': 'fadeInDown 0.3s ease',
        'fade-in-up': 'fadeInUp 0.3s ease',
        'scale-in': 'scaleIn 0.2s ease',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.3s ease',
        spin: 'spin 1s linear infinite',
        shimmer: 'shimmer 1.5s ease infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-recording': 'pulseRed 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeInUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        slideDown: { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(0)' } },
        spin: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseRed: {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 59, 48, 0.4)' },
          '70%': { boxShadow: '0 0 0 6px rgba(255, 59, 48, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255, 59, 48, 0)' },
        },
        pulseGlow: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
    },
  },
  plugins: [],
};

export default config;
