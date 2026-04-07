/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md}'],
  theme: {
    extend: {
      colors: {
        bg:          '#0e0d0b',
        'bg-2':      '#14120f',
        'bg-raised': '#1a1714',
        border:      '#2b2620',
        text:        '#e8e1d3',
        dim:         '#8a7f6c',
        mute:        '#56503f',
        accent:      '#c96442',
        ok:          '#7fae6b',
        err:         '#c75d5d',
        blu:         '#6f9dbf',
        mag:         '#a878a8',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'SF Mono', 'ui-monospace', 'monospace'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
      },
      fontSize: {
        meta:  ['11px', '1.6'],
        body:  ['13px', '1.6'],
        hero:  ['15px', '1.7'],
        quote: ['16px', '1.7'],
      },
      maxWidth: {
        terminal: '920px',
      },
      borderRadius: {
        sm: '3px',
      },
    },
  },
  plugins: [],
};
