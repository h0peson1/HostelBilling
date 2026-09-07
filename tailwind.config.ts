import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './*.html',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4338ca',
        'primary-container': '#3730a3',
        'on-primary': '#ffffff',
        secondary: '#059669',
        'secondary-container': '#d1fae5',
        'on-secondary-container': '#065f46',
        surface: '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f8fafc',
        'surface-container': '#f1f5f9',
        'surface-container-high': '#e2e8f0',
        'on-surface': '#0f172a',
        'on-surface-variant': '#475569',
        outline: '#94a3b8',
        'outline-variant': '#cbd5e1',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['var(--font-heading)', 'var(--font-plus-jakarta-sans)', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
