/**
 * tailwind.config.ts — Tailwind CSS configuration.
 * Extends the default theme with:
 * - shadcn-vue CSS variables (hsl-based) for component library theming
 * - Percy design system tokens (percy-*) for app-level theming
 * - Quicksand font family
 */
import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{vue,ts,tsx}', './components/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // shadcn-vue tokens (kept for component library compatibility)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Percy design system tokens
        percy: {
          primary: 'var(--percy-primary)',
          'primary-hover': 'var(--percy-primary-hover)',
          'primary-light': 'var(--percy-primary-light)',
          'primary-text': 'var(--percy-primary-text)',
          secondary: 'var(--percy-secondary)',
          'secondary-hover': 'var(--percy-secondary-hover)',
          'secondary-light': 'var(--percy-secondary-light)',
          'secondary-text': 'var(--percy-secondary-text)',
          accent: 'var(--percy-accent)',
          'accent-light': 'var(--percy-accent-light)',
          'accent-text': 'var(--percy-accent-text)',
          'bg-page': 'var(--percy-bg-page)',
          'bg-card': 'var(--percy-bg-card)',
          'bg-sidebar': 'var(--percy-bg-sidebar)',
          'bg-nav': 'var(--percy-bg-nav)',
          'bg-input': 'var(--percy-bg-input)',
          border: 'var(--percy-border)',
          'border-input': 'var(--percy-border-input)',
          'text-primary': 'var(--percy-text-primary)',
          'text-secondary': 'var(--percy-text-secondary)',
          'text-muted': 'var(--percy-text-muted)',
          success: 'var(--percy-success)',
          'success-light': 'var(--percy-success-light)',
          warning: 'var(--percy-warning)',
          'warning-light': 'var(--percy-warning-light)',
          danger: 'var(--percy-danger)',
          'danger-light': 'var(--percy-danger-light)',
          info: 'var(--percy-info)',
          'info-light': 'var(--percy-info-light)',
        },
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
        xl: '16px',
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;