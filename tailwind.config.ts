/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#E6E6FA', dark: '#D5D5F0' },
        card: { DEFAULT: '#FDF5E6', hover: '#FAF0DC' },
        accent: {
          yellow: '#FFE566',
          'yellow-dark': '#F5D800',
          violet: '#5B21B6',
          'violet-light': '#7C3AED',
          'violet-dim': '#EDE9FE',
        },
        text: {
          heading: '#1C0A4A',
          body: '#3D2B6B',
          muted: '#8B8BA3',
          light: '#B8B8CC',
        },
        status: {
          titan: '#5B21B6',
          consistent: '#059669',
          slipping: '#D97706',
          culprit: '#DC2626',
          ontrack: '#2563EB',
          new: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '32px',
        'card-sm': '20px',
        pill: '9999px',
      },
      boxShadow: {
        float: '0 8px 32px rgba(91,33,182,0.12)',
        'float-lg': '0 16px 64px rgba(91,33,182,0.18)',
        card: '0 2px 12px rgba(91,33,182,0.07)',
        glow: '0 0 24px rgba(91,33,182,0.25)',
      },
      backgroundImage: {
        'violet-gradient': 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
        'yellow-gradient': 'linear-gradient(135deg, #FFE566 0%, #F5D800 100%)',
        'card-gradient': 'linear-gradient(145deg, #FDF5E6 0%, #F8EDDA 100%)',
        'hero-gradient': 'linear-gradient(135deg, #E6E6FA 0%, #D5D5F0 50%, #EDE9FE 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'flame': 'flame 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        flame: { from: { transform: 'scaleY(1) rotate(-2deg)' }, to: { transform: 'scaleY(1.1) rotate(2deg)' } },
      },
    },
  },
  plugins: [],
}
