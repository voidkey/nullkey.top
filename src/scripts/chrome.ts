// Loaded on every page. Handles clock, uptime, theme persistence.
// Terminal-only behavior lives in terminal.ts.

import { restoreTheme } from '~/lib/theme';

restoreTheme();

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
