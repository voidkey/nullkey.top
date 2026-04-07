import { tokenize } from '~/lib/commands';

// ─── DOM refs ──────────────────────────────────────────────────────────
const term = document.getElementById('term') as HTMLElement | null;
const out = document.getElementById('out') as HTMLElement | null;
const input = document.getElementById('terminal-input') as HTMLInputElement | null;
const caret = document.getElementById('caret') as HTMLElement | null;
const clockEl = document.getElementById('clock');
const uptimeEl = document.getElementById('uptime');
const themeNameEl = document.getElementById('theme-name');
const dataNode = document.getElementById('content-data');

if (!term || !out || !input || !caret) {
  throw new Error('terminal: missing required nodes');
}

// ─── Content collection data ──────────────────────────────────────────
type ProjectData = { name: string; summary: string; lang: string; repo: string | null; body: string };
type ContentData = {
  about: string;
  now: string;
  nowUpdated: string | null;
  uses: string;
  projects: ProjectData[];
};
const CONTENT: ContentData = dataNode
  ? JSON.parse(dataNode.textContent || '{}')
  : { about: '', now: '', nowUpdated: null, uses: '', projects: [] };

// ─── Clock / uptime in topbar + statusbar ─────────────────────────────
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

// ─── Theme system ─────────────────────────────────────────────────────
const THEMES = ['clay', 'gruvbox', 'nord', 'paper'] as const;
type Theme = typeof THEMES[number];
const THEME_KEY = 'nullkey-theme';

function applyTheme(name: Theme) {
  const html = document.documentElement;
  THEMES.forEach((t) => html.classList.remove(`theme-${t}`));
  html.classList.add(`theme-${name}`);
  if (themeNameEl) themeNameEl.textContent = name;
  try {
    localStorage.setItem(THEME_KEY, name);
  } catch {}
}

function currentTheme(): Theme {
  const html = document.documentElement;
  for (const t of THEMES) if (html.classList.contains(`theme-${t}`)) return t;
  return 'clay';
}

// Restore from localStorage on boot
try {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && (THEMES as readonly string[]).includes(saved)) {
    applyTheme(saved as Theme);
  } else {
    applyTheme('clay');
  }
} catch {
  applyTheme('clay');
}

// ─── Helpers: escape + tiny markdown ──────────────────────────────────
function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

function slashHL(s: string): string {
  return s.replace(/(^|[\s(])\/([a-z][a-z0-9-]*)/gi, '$1<span class="text-accent">/$2</span>');
}

function inlineMd(s: string): string {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code class="text-accent">$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text">$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em class="text-accent font-serif italic">$2</em>');
  s = slashHL(s);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent">$1</a>');
  return s;
}

function renderMd(src: string): string {
  src = src.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  const blocks = src.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((b) => {
      if (/^#{1,3}\s/.test(b)) {
        const m = b.match(/^(#{1,3})\s+(.*)$/)!;
        const lvl = m[1].length;
        return `<h${lvl} class="text-accent text-[11px] uppercase tracking-widest mt-3 mb-1 font-medium">${inlineMd(m[2])}</h${lvl}>`;
      }
      if (/^>\s/.test(b)) {
        return `<blockquote class="border-l-2 border-accent pl-3 my-2 italic font-serif text-text">${inlineMd(b.replace(/^>\s?/gm, ''))}</blockquote>`;
      }
      if (/^---+$/.test(b)) return `<hr class="border-0 border-t border-dashed border-border my-3">`;
      if (/^[-*]\s/.test(b)) {
        const items = b.split(/\n/).map((l) => l.replace(/^[-*]\s+/, ''));
        return `<ul class="list-none my-1 space-y-0.5">${items.map((i) => `<li class="text-text"><span class="text-mute">·</span> ${inlineMd(i)}</li>`).join('')}</ul>`;
      }
      return `<p class="my-1.5">${inlineMd(b)}</p>`;
    })
    .join('');
}

// ─── Output renderers ─────────────────────────────────────────────────
type Block =
  | ['line', string]
  | ['raw', string]
  | ['card', string, string]
  | ['md', string];

function append(html: string) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  while (wrapper.firstChild) out!.appendChild(wrapper.firstChild);
}

function renderBlocks(blocks: Block[]) {
  for (const b of blocks) {
    if (b[0] === 'line') append(`<pre class="out-line">${b[1]}</pre>`);
    else if (b[0] === 'raw') append(b[1]);
    else if (b[0] === 'card')
      append(`<div class="out-card"><h5>$ ${esc(b[1])}</h5><div class="text-[13px] text-text">${b[2]}</div></div>`);
    else if (b[0] === 'md') append(`<div class="out-card text-[13px]">${renderMd(b[1])}</div>`);
  }
  scrollEnd();
}

function scrollEnd() {
  term!.scrollTop = term!.scrollHeight;
}

// ─── PS1 echo for each command ────────────────────────────────────────
function echoCommand(raw: string) {
  const html =
    '<pre class="out-line"><span class="text-ok">nullkey</span><span class="text-mute">@</span><span class="text-accent">portal</span><span class="text-mute">:</span><span class="text-blu">~</span> <span class="text-mag">(main)</span> <span class="text-accent">❯</span> ' +
    esc(raw) +
    '</pre>';
  append(html);
}

// ─── Command registry ─────────────────────────────────────────────────
const COMMANDS: Record<string, (args: string[]) => Block[] | void> = {
  help() {
    return [
      ['line', 'available commands:'],
      ['line', '  <span class="text-accent">help</span>       show this list'],
      ['line', '  <span class="text-accent">whoami</span>     short bio'],
      ['line', '  <span class="text-accent">about</span>      a longer story'],
      ['line', '  <span class="text-accent">now</span>        what i\'m doing right now'],
      ['line', '  <span class="text-accent">projects</span>   things i\'ve built'],
      ['line', '  <span class="text-accent">projects</span> &lt;n&gt;  open one'],
      ['line', '  <span class="text-accent">uses</span>       hardware &amp; tools'],
      ['line', '  <span class="text-accent">contact</span>    how to reach me'],
      ['line', '  <span class="text-accent">theme</span>      cycle themes (clay · gruvbox · nord · paper)'],
      ['line', '  <span class="text-accent">theme</span> &lt;name&gt; jump to a specific one'],
      ['line', '  <span class="text-accent">cat</span>        meow'],
      ['line', '  <span class="text-accent">ls</span>  <span class="text-accent">pwd</span>  <span class="text-accent">echo</span>  <span class="text-accent">date</span>  <span class="text-accent">clear</span>  <span class="text-accent">sudo</span>'],
    ];
  },
  whoami() {
    return [['line', '<span class="text-text">nullkey</span> · software engineer · shanghai']];
  },
  about() {
    return [['md', CONTENT.about]];
  },
  now() {
    const header = CONTENT.nowUpdated
      ? `<p class="text-mute text-[11px] mb-1">updated ${CONTENT.nowUpdated}</p>`
      : '';
    return [['raw', `<div class="out-card text-[13px]">${header}${renderMd(CONTENT.now)}</div>`]];
  },
  uses() {
    return [['md', CONTENT.uses]];
  },
  projects(args) {
    if (args[0]) {
      const n = parseInt(args[0], 10);
      const p = CONTENT.projects[n - 1];
      if (!p) return [['line', `<span class="text-err">no project at index ${esc(args[0])}</span>`]];
      const repoHtml = p.repo
        ? `<a href="${esc(p.repo)}" class="text-accent">${esc(p.repo)}</a>`
        : '<span class="text-mute">—</span>';
      return [
        [
          'raw',
          `<div class="out-card text-[13px]">
            <h5>$ projects/${esc(p.name)}</h5>
            <p class="text-mute text-[11px]"><span class="text-accent">${esc(p.lang)}</span> · ${repoHtml}</p>
            <p class="text-text my-1">${esc(p.summary)}</p>
            ${renderMd(p.body)}
          </div>`,
        ],
      ];
    }
    const rows = CONTENT.projects
      .map((p, i) => {
        const idx = String(i + 1).padStart(2, '0');
        return `<div class="grid grid-cols-[28px_1fr_70px] gap-3 items-baseline py-2 border-b border-dashed border-border last:border-b-0">
          <span class="text-mute">${idx}</span>
          <div>
            <div class="text-text">${esc(p.name)}</div>
            <div class="text-dim text-[11px]">${esc(p.summary)}</div>
          </div>
          <span class="text-accent text-[11px]">${esc(p.lang)}</span>
        </div>`;
      })
      .join('');
    return [
      ['raw', `<div class="out-card text-[13px]"><h5>$ projects — ${CONTENT.projects.length} results</h5>${rows}</div>`],
      ['line', '<span class="text-mute">→ </span><span class="text-accent">projects &lt;n&gt;</span><span class="text-mute"> to open one</span>'],
    ];
  },
  contact() {
    return [
      [
        'raw',
        `<div class="out-card text-[13px]">
          <h5>$ contact</h5>
          <div class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1">
            <span class="text-accent">github</span><a href="https://github.com/nullkey">github.com/nullkey</a>
            <span class="text-accent">x</span><a href="https://x.com/nullkey">@nullkey</a>
            <span class="text-accent">email</span><a href="mailto:hi@nullkey.dev">hi@nullkey.dev</a>
          </div>
        </div>`,
      ],
    ];
  },
  date() {
    return [['line', `<span class="text-dim">${esc(new Date().toString())}</span>`]];
  },
  cat() {
    return [['line', '<span class="text-accent">meow.</span> <span class="text-mute">(clovemere stretches.)</span>']];
  },
  ls() {
    return [
      ['line', '<span class="text-blu">about/</span>  <span class="text-blu">projects/</span>  <span class="text-blu">uses/</span>  contact.txt  cat.gif'],
    ];
  },
  pwd() {
    return [['line', '/home/nullkey']];
  },
  echo(args) {
    return [['line', esc(args.join(' '))]];
  },
  exit() {
    return [['line', '<span class="text-mute">nice try. you\'re stuck here with me.</span>']];
  },
  sudo() {
    return [
      ['line', '<span class="text-err">nullkey is not in the sudoers file.</span>'],
      ['line', '<span class="text-mute">this incident will be remembered fondly.</span>'],
    ];
  },
  pet() {
    return [['line', '<span class="text-mute italic">*purrs* — clovemere</span>']];
  },
  theme(args) {
    let next: Theme;
    if (args[0]) {
      const requested = args[0].toLowerCase();
      if (!(THEMES as readonly string[]).includes(requested)) {
        return [['line', `<span class="text-err">unknown theme:</span> ${esc(args[0])}  <span class="text-mute">(try </span>${THEMES.map((t) => `<span class="text-accent">${t}</span>`).join('<span class="text-mute"> · </span>')}<span class="text-mute">)</span>`]];
      }
      next = requested as Theme;
    } else {
      const idx = THEMES.indexOf(currentTheme());
      next = THEMES[(idx + 1) % THEMES.length]!;
    }
    applyTheme(next);
    return [['line', `theme → <span class="text-accent">${next}</span>`]];
  },
  clear() {
    out!.innerHTML = '';
    const boot = document.getElementById('boot');
    if (boot) boot.style.display = 'none';
    return;
  },
};
COMMANDS.man = COMMANDS.help!;
COMMANDS['?'] = COMMANDS.help!;

// ─── Run a command ────────────────────────────────────────────────────
function run(raw: string) {
  echoCommand(raw);
  const { cmd, args } = tokenize(raw);
  if (!cmd) {
    scrollEnd();
    return;
  }
  const handler = COMMANDS[cmd];
  if (handler) {
    const result = handler(args);
    if (Array.isArray(result)) renderBlocks(result);
    else scrollEnd();
  } else {
    append(
      `<pre class="out-line text-err">zsh: command not found: ${esc(cmd)}  <span class="text-mute">(try </span><span class="text-accent">help</span><span class="text-mute">)</span></pre>`
    );
    scrollEnd();
  }
}

// ─── Custom caret tracking ────────────────────────────────────────────
const ghost = document.createElement('span');
ghost.style.cssText =
  'position:absolute;visibility:hidden;white-space:pre;font:inherit;left:-9999px;top:0;font-family:"JetBrains Mono",monospace;font-size:13px;';
document.body.appendChild(ghost);
function updateCaret() {
  ghost.textContent = input!.value || '';
  const w = Math.min(ghost.offsetWidth, input!.clientWidth);
  caret!.style.transform = `translateX(${-input!.clientWidth + w}px)`;
}
input.addEventListener('input', updateCaret);
window.addEventListener('resize', updateCaret);
new ResizeObserver(updateCaret).observe(input);
setTimeout(updateCaret, 80);

// ─── History + keys ───────────────────────────────────────────────────
const history: string[] = [];
let hi = -1;

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const v = input.value;
    if (v.trim()) history.unshift(v);
    hi = -1;
    input.value = '';
    updateCaret();
    run(v);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (hi < history.length - 1) {
      hi++;
      input.value = history[hi]!;
      updateCaret();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (hi > 0) {
      hi--;
      input.value = history[hi]!;
    } else {
      hi = -1;
      input.value = '';
    }
    updateCaret();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const pre = input.value.toLowerCase();
    if (!pre) return;
    const matches = Object.keys(COMMANDS).filter((k) => k.startsWith(pre));
    if (matches.length === 1) {
      input.value = matches[0]!;
      updateCaret();
    } else if (matches.length > 1) {
      append(`<pre class="out-line text-dim">${matches.join('  ')}</pre>`);
      scrollEnd();
    }
  } else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault();
    COMMANDS.clear!([]);
  }
});

function focusInput() {
  input!.focus({ preventScroll: true });
}
document.addEventListener('click', (e) => {
  const sel = window.getSelection();
  if (sel && sel.toString().length > 0) return;
  const target = e.target as HTMLElement;
  if (target.closest('a, input')) return;
  focusInput();
});
focusInput();
