// Loaded on every page. Handles clock, uptime, theme persistence,
// and the topbar theme switcher.
// Terminal-only behavior lives in terminal.ts.

import { applyTheme, restoreTheme, currentTheme, type Theme } from '~/lib/theme';

restoreTheme();

// ─── Theme switcher buttons (in topbar) ────────────────────────────────
function syncSwitcher() {
  const active = currentTheme();
  document.querySelectorAll<HTMLButtonElement>('#theme-switcher .theme-dot').forEach((btn) => {
    btn.dataset.active = btn.dataset.theme === active ? 'true' : 'false';
  });
}
syncSwitcher();

document.querySelectorAll<HTMLButtonElement>('#theme-switcher .theme-dot').forEach((btn) => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.theme as Theme | undefined;
    if (!name) return;
    applyTheme(name);
    syncSwitcher();
  });
});

const clockEl = document.getElementById('clock');
const uptimeEl = document.getElementById('uptime');
const startedAt = Date.now();

function tick() {
  const d = new Date();
  if (clockEl) {
    clockEl.textContent =
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  if (uptimeEl) {
    const s = Math.floor((Date.now() - startedAt) / 1000);
    uptimeEl.textContent = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  }
}
tick();
setInterval(tick, 1000);
