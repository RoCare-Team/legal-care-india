/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
    extend: {
      colors: {
        // Driven by CSS variables declared in globals.css
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-secondary-dark) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        /* Layered and tinted navy rather than grey — on a cool page backdrop a
           neutral shadow reads as dirt, a tinted one reads as depth. */
        card: '0 1px 2px rgb(30 58 95 / 0.06), 0 4px 12px -4px rgb(30 58 95 / 0.10), 0 12px 32px -16px rgb(30 58 95 / 0.14)',
        'card-hover':
          '0 2px 4px rgb(30 58 95 / 0.08), 0 12px 24px -8px rgb(30 58 95 / 0.16), 0 28px 56px -24px rgb(30 58 95 / 0.28)',
        /* For raised navy elements (buttons, banners) that need to feel solid. */
        brand: '0 2px 6px -1px rgb(30 58 95 / 0.28), 0 10px 24px -12px rgb(30 58 95 / 0.45)',
        'brand-hover':
          '0 4px 10px -2px rgb(30 58 95 / 0.34), 0 18px 36px -16px rgb(30 58 95 / 0.55)',
        /* Gold halo, used sparingly on the single most important CTA. */
        gold: '0 2px 6px -1px rgb(212 175 55 / 0.35), 0 12px 28px -12px rgb(212 175 55 / 0.55)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /* Sweep across a skeleton block, left to right. */
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        /* Indeterminate progress bar: a short segment crossing the whole track.
           500% of the segment's own width carries it clear of both ends. */
        'progress-sweep': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(500%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
        'progress-sweep': 'progress-sweep 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
