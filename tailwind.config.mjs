/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md}'],
  theme: {
    extend: {
      colors: {
        bg:          'var(--c-bg)',
        'bg-2':      'var(--c-bg-2)',
        'bg-raised': 'var(--c-bg-raised)',
        border:      'var(--c-border)',
        text:        'var(--c-text)',
        dim:         'var(--c-dim)',
        mute:        'var(--c-mute)',
        accent:      'var(--c-accent)',
        ok:          'var(--c-ok)',
        err:         'var(--c-err)',
        blu:         'var(--c-blu)',
        mag:         'var(--c-mag)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'SF Mono', 'ui-monospace', 'monospace'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
      },
      fontSize: {
        meta: ['11px', '1.6'],
        body: ['13px', '1.6'],
        hero: ['15px', '1.7'],
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
