/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md}'],
  theme: {
    extend: {
      colors: {
        bg:          '#1a1613',
        'bg-raised': '#211b16',
        border:      '#2d2620',
        text:        '#e8e1d6',
        dim:         '#8a7f6f',
        accent:      '#d97757',
        ok:          '#a7c080',
        err:         '#e06c75',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'SF Mono', 'ui-monospace', 'monospace'],
        serif: ['Georgia', 'serif'],
      },
      fontSize: {
        meta:  ['12px', '1.7'],
        body:  ['13px', '1.7'],
        hero:  ['15px', '1.7'],
        quote: ['16px', '1.7'],
      },
      maxWidth: {
        terminal: 'min(760px, 92vw)',
      },
      borderRadius: {
        sm: '4px',
      },
    },
  },
  plugins: [],
};
