export const THEMES = ['clay', 'gruvbox', 'paper', 'nord'] as const;
export type Theme = typeof THEMES[number];

const THEME_KEY = 'nullkey-theme';

export function applyTheme(name: Theme): void {
  const html = document.documentElement;
  THEMES.forEach((t) => html.classList.remove(`theme-${t}`));
  html.classList.add(`theme-${name}`);
  const nameEl = document.getElementById('theme-name');
  if (nameEl) nameEl.textContent = name;
  try {
    localStorage.setItem(THEME_KEY, name);
  } catch {}
}

export function currentTheme(): Theme {
  const html = document.documentElement;
  for (const t of THEMES) if (html.classList.contains(`theme-${t}`)) return t;
  return 'clay';
}

export function restoreTheme(): void {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && (THEMES as readonly string[]).includes(saved)) {
      applyTheme(saved as Theme);
      return;
    }
  } catch {}
  applyTheme('clay');
}
