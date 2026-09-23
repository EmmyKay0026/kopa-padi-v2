import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {
    colors: {
      primary: { DEFAULT: 'rgb(var(--primary) / <alpha-value>)', dark: 'rgb(var(--primary-dark) / <alpha-value>)', light: 'rgb(var(--primary-light) / <alpha-value>)' },
      accent: 'rgb(var(--accent) / <alpha-value>)', success: 'rgb(var(--success) / <alpha-value>)', warning: 'rgb(var(--warning) / <alpha-value>)', danger: 'rgb(var(--danger) / <alpha-value>)',
      background: 'rgb(var(--background) / <alpha-value>)', surface: 'rgb(var(--surface) / <alpha-value>)', foreground: 'rgb(var(--foreground) / <alpha-value>)', muted: 'rgb(var(--muted) / <alpha-value>)', border: 'rgb(var(--border) / <alpha-value>)',
    },
    fontFamily: { sans: ['var(--font-sans)', 'Arial', 'sans-serif'] },
    boxShadow: { soft: '0 18px 50px rgba(15, 118, 110, 0.10)' },
    borderRadius: { card: '1.125rem' },
  } }, plugins: [],
};
export default config;
