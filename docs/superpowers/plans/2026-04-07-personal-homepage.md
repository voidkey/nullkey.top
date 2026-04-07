# Personal Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page personal homepage that renders as a Claude-Code-styled REPL: warm dark, mono-first, terracotta accent, ASCII details, with an illustrated mascot in the corner.

**Architecture:** Astro static site with Tailwind. The page is a server-rendered shell (topbar, hero, promptline) plus two tiny vanilla-TS client scripts: one for the terminal REPL (command dispatch, history, panel summoning), one for the mascot. Panel content comes from Astro content collections, rendered to HTML at build time and injected into hidden `<template>` elements; the terminal script clones them into the summon area on command. Zero framework runtime, ~25kb JS budget total.

**Tech Stack:** Astro 4, Tailwind CSS 3, TypeScript, Vitest (for command-parser unit tests), `@fontsource/jetbrains-mono`, content collections (Markdown).

**Reference spec:** [`docs/superpowers/specs/2026-04-07-personal-homepage-design.md`](../specs/2026-04-07-personal-homepage-design.md). The spec is the source of truth for visual tokens, command behavior, and mascot states. Re-read it before each task.

---

## File Structure

```
homepage/
├── .gitignore
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── public/
│   └── mascot/
│       └── clove-placeholder.svg
├── src/
│   ├── styles/
│   │   └── global.css              # theme tokens, font @import, scrollbar
│   ├── content/
│   │   ├── config.ts               # collection schemas
│   │   ├── about.md
│   │   ├── now.md
│   │   ├── uses.md
│   │   └── projects/
│   │       ├── vibeknow.md
│   │       └── ...
│   ├── lib/
│   │   ├── commands.ts             # pure command parser + dispatcher
│   │   └── commands.test.ts        # vitest tests
│   ├── components/
│   │   ├── Topbar.astro
│   │   ├── Hero.astro              # whoami ASCII block (static)
│   │   ├── Promptline.astro        # static markup; script attaches behavior
│   │   ├── PanelTemplates.astro    # renders all panels as <template> tags
│   │   └── Mascot.astro            # inline SVG + script
│   ├── scripts/
│   │   ├── terminal.ts             # client script: input, history, dispatch, typewriter
│   │   └── mascot.ts               # client script: state machine for mascot
│   ├── pages/
│   │   └── index.astro
│   └── env.d.ts
└── docs/superpowers/...
```

**Responsibility split:**
- `lib/commands.ts` is **pure** (no DOM) so it's unit-testable: takes a string, returns `{kind: 'panel'|'clear'|'unknown'|'easter', name?, arg?}`.
- `scripts/terminal.ts` handles DOM: focus, keydown, history navigation, panel injection, typewriter, transitions. It calls `commands.ts` for parsing.
- `scripts/mascot.ts` is independent — only listens to a few custom events on `window` (`terminal:type`, `terminal:unknown`, `terminal:summon`, `terminal:pet`).
- `Topbar`, `Hero`, `Promptline`, `PanelTemplates`, `Mascot` are static Astro components — no client JS in the components themselves.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`, `.gitignore`, `src/pages/index.astro`, `src/env.d.ts`

- [ ] **Step 1: Initialize git and create `.gitignore`**

```bash
cd /Users/nullkey/project/homepage
git init
```

Create `.gitignore`:

```
node_modules
dist
.astro
.DS_Store
.env
.env.*
.superpowers/
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "homepage",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "@astrojs/tailwind": "^5.1.0",
    "tailwindcss": "^3.4.0",
    "@fontsource/jetbrains-mono": "^5.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: installs cleanly, creates `node_modules` and `package-lock.json`.

- [ ] **Step 4: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: false })],
  output: 'static',
});
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "~/*": ["src/*"] }
  }
}
```

- [ ] **Step 6: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 7: Create minimal `src/pages/index.astro`**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>nullkey</title>
  </head>
  <body>
    <main>scaffolding works</main>
  </body>
</html>
```

- [ ] **Step 8: Verify dev server runs**

```bash
npm run dev
```

Expected: Astro starts on `http://localhost:4321`, page shows "scaffolding works". Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: scaffold astro + tailwind project"
```

---

## Task 2: Theme tokens, fonts, and global styles

**Files:**
- Create: `src/styles/global.css`
- Modify: `tailwind.config.mjs`, `src/pages/index.astro`

- [ ] **Step 1: Configure Tailwind theme tokens**

Replace `tailwind.config.mjs`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md}'],
  theme: {
    extend: {
      colors: {
        bg:         '#1a1613',
        'bg-raised':'#211b16',
        border:     '#2d2620',
        text:       '#e8e1d6',
        dim:        '#8a7f6f',
        accent:     '#d97757',
        ok:         '#a7c080',
        err:        '#e06c75',
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
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/600.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    background: theme('colors.bg');
    color: theme('colors.text');
    font-family: theme('fontFamily.mono');
    font-size: 13px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }
  body {
    min-height: 100svh;
    margin: 0;
  }
  ::selection {
    background: theme('colors.accent');
    color: theme('colors.bg');
  }
  /* Thin dark scrollbar for the summon area */
  .scroll-thin::-webkit-scrollbar { width: 6px; }
  .scroll-thin::-webkit-scrollbar-track { background: transparent; }
  .scroll-thin::-webkit-scrollbar-thumb {
    background: theme('colors.border');
    border-radius: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Import global.css in `index.astro`**

Replace the frontmatter and head of `src/pages/index.astro`:

```astro
---
import '~/styles/global.css';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>nullkey</title>
  </head>
  <body>
    <main class="font-mono text-body text-text bg-bg">theme works</main>
  </body>
</html>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Expected: page shows "theme works" in JetBrains Mono on the warm dark background.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: theme tokens, JetBrains Mono, global styles"
```

---

## Task 3: Content collections schema

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Define collection schemas**

Create `src/content/config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    lang: z.string(),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    order: z.number(),
  }),
});

const singletons = defineCollection({
  type: 'content',
  schema: z.object({
    updated: z.coerce.date().optional(),
  }),
});

export const collections = {
  projects,
  about: singletons,
  now: singletons,
  uses: singletons,
};
```

- [ ] **Step 2: Verify Astro recognizes collections**

```bash
npm run dev
```

Expected: no errors. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat: content collection schemas"
```

---

## Task 4: Seed content files

**Files:**
- Create: `src/content/about/about.md`, `src/content/now/now.md`, `src/content/uses/uses.md`, `src/content/projects/vibeknow.md`, `src/content/projects/openclaw.md`, `src/content/projects/go-atlas.md`, `src/content/projects/homepage.md`

> Note: Astro singletons-as-collection: each singleton needs at least one entry. We use a single file per singleton collection (`about/about.md`, etc).

- [ ] **Step 1: Create `src/content/about/about.md`**

```markdown
---
---

I'm Nullkey, a software engineer based in Shanghai. I build small, sharp tools — sometimes for everyone, often just for myself.

I work mostly in Go and TypeScript, with detours into anything that lets me ship something useful before lunch.

> *I'd rather write a hundred lines I understand than ten thousand I trust.*

These days I'm thinking about local-first AI tooling, browser-driving agents, and how to make CLIs feel like instruments instead of forms.
```

- [ ] **Step 2: Create `src/content/now/now.md`**

```markdown
---
updated: 2026-04-07
---

Currently building **vibeknow** — a knowledge base that talks back, running on local LLMs. Most of my evenings go to chipping at it.

Reading: *The Soul of a New Machine*. Listening to: a lot of post-rock.
```

- [ ] **Step 3: Create `src/content/uses/uses.md`**

```markdown
---
---

### Hardware
- MacBook Pro 14" (M3 Pro)
- Keychron Q1 with Holy Pandas
- Logitech MX Master 3S

### Editor
- Neovim (LazyVim)
- VS Code for the React side of things

### CLI
- Ghostty
- Fish + Starship
- ripgrep, fd, fzf, bat, jq

### Daily
- Linear, Raycast, 1Password, Obsidian
```

- [ ] **Step 4: Create `src/content/projects/vibeknow.md`**

```markdown
---
name: vibeknow
summary: a knowledge base that talks back, built on local LLMs
lang: go
repo: https://github.com/nullkey/vibeknow
order: 1
---

A knowledge base that ingests your notes, code, and bookmarks, then lets you query them in plain language using a local model. No data leaves the machine.
```

- [ ] **Step 5: Create `src/content/projects/openclaw.md`**

```markdown
---
name: openclaw
summary: browser-driving agent runtime for everyday automation
lang: ts
repo: https://github.com/nullkey/openclaw
order: 2
---

A small runtime that lets agents drive a real browser to do real things — fill forms, scrape, click through flows — with a tiny scripting surface.
```

- [ ] **Step 6: Create `src/content/projects/go-atlas.md`**

```markdown
---
name: go-atlas
summary: a tiny atlas of go patterns I keep reaching for
lang: go
repo: https://github.com/nullkey/go-atlas
order: 3
---

A growing reference of Go idioms, snippets, and gotchas — the things I look up so often that I finally wrote them down.
```

- [ ] **Step 7: Create `src/content/projects/homepage.md`**

```markdown
---
name: homepage
summary: this thing — yes, the page is itself a project
lang: astro
order: 4
---

The page you're looking at. A REPL that doubles as a name card. Built with Astro, Tailwind, and ~5kb of vanilla TypeScript.
```

- [ ] **Step 8: Verify build still works**

```bash
npm run dev
```

Expected: no errors. Stop server.

- [ ] **Step 9: Commit**

```bash
git add src/content/
git commit -m "feat: seed content files"
```

---

## Task 5: Pure command parser + tests (TDD)

**Files:**
- Create: `src/lib/commands.ts`, `src/lib/commands.test.ts`, `vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '~': new URL('./src', import.meta.url).pathname },
  },
});
```

- [ ] **Step 2: Write failing tests in `src/lib/commands.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { parseCommand } from './commands';

describe('parseCommand', () => {
  it('parses a known panel command', () => {
    expect(parseCommand('about')).toEqual({ kind: 'panel', name: 'about' });
  });

  it('trims whitespace and ignores case', () => {
    expect(parseCommand('  Projects  ')).toEqual({ kind: 'panel', name: 'projects' });
  });

  it('parses projects with index argument', () => {
    expect(parseCommand('projects 2')).toEqual({ kind: 'panel', name: 'projects', arg: '2' });
  });

  it('parses clear', () => {
    expect(parseCommand('clear')).toEqual({ kind: 'clear' });
  });

  it('parses help', () => {
    expect(parseCommand('help')).toEqual({ kind: 'panel', name: 'help' });
  });

  it('parses sudo as easter egg', () => {
    expect(parseCommand('sudo rm -rf /')).toEqual({ kind: 'easter', name: 'sudo' });
  });

  it('parses pet as easter egg', () => {
    expect(parseCommand('pet')).toEqual({ kind: 'easter', name: 'pet' });
  });

  it('returns unknown for nonsense', () => {
    expect(parseCommand('foobar')).toEqual({ kind: 'unknown', input: 'foobar' });
  });

  it('returns noop for empty input', () => {
    expect(parseCommand('')).toEqual({ kind: 'noop' });
    expect(parseCommand('   ')).toEqual({ kind: 'noop' });
  });
});
```

- [ ] **Step 3: Run tests, verify they fail**

```bash
npm test
```

Expected: all tests fail because `commands.ts` doesn't exist yet.

- [ ] **Step 4: Implement `src/lib/commands.ts`**

```ts
export type ParsedCommand =
  | { kind: 'panel'; name: string; arg?: string }
  | { kind: 'clear' }
  | { kind: 'easter'; name: 'sudo' | 'pet' }
  | { kind: 'unknown'; input: string }
  | { kind: 'noop' };

const PANEL_NAMES = new Set([
  'whoami', 'about', 'now', 'projects', 'uses', 'contact', 'help',
]);

export function parseCommand(raw: string): ParsedCommand {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') return { kind: 'noop' };
  if (trimmed === 'clear') return { kind: 'clear' };
  if (trimmed === 'pet') return { kind: 'easter', name: 'pet' };
  if (trimmed.startsWith('sudo')) return { kind: 'easter', name: 'sudo' };

  const [head, ...rest] = trimmed.split(/\s+/);
  if (PANEL_NAMES.has(head)) {
    return rest.length > 0
      ? { kind: 'panel', name: head, arg: rest.join(' ') }
      : { kind: 'panel', name: head };
  }
  return { kind: 'unknown', input: raw.trim() };
}
```

- [ ] **Step 5: Run tests, verify they pass**

```bash
npm test
```

Expected: all 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ vitest.config.ts
git commit -m "feat: pure command parser with tests"
```

---

## Task 6: Static layout shell — Topbar, Hero, Promptline

**Files:**
- Create: `src/components/Topbar.astro`, `src/components/Hero.astro`, `src/components/Promptline.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/Topbar.astro`**

```astro
---
---
<header class="flex justify-between text-meta text-dim border-b border-border pb-2 mb-4 sticky top-0 bg-bg z-10">
  <span>nullkey<span class="text-dim">@homepage</span> <span>~</span> <span class="text-accent">main</span></span>
  <span class="text-accent">● connected</span>
</header>
```

- [ ] **Step 2: Create `src/components/Hero.astro`**

The hero is the ASCII-framed `whoami` block. Decorative ASCII characters; spec §5 says decoration uses box-drawing, structure uses CSS borders.

```astro
---
---
<section class="text-body" aria-label="whoami">
  <pre class="m-0 font-mono whitespace-pre"><span class="text-dim">┌─</span> <span class="text-accent">whoami</span>
<span class="text-dim">│</span>  Nullkey · software engineer · Shanghai
<span class="text-dim">│</span>  <em class="font-serif text-quote not-italic">"</em><em class="font-serif text-quote">I build small, sharp things — sometimes for everyone.</em><em class="font-serif text-quote not-italic">"</em>
<span class="text-dim">└─</span> <span class="text-ok">ok</span> <span class="text-dim">(0.04s)</span></pre>
</section>
```

- [ ] **Step 3: Create `src/components/Promptline.astro`**

Hint command names are real `<button>` elements (spec §9). Cursor is a span animated by CSS.

```astro
---
const HINTS = ['about', 'now', 'projects', 'uses', 'contact', 'help'];
---
<footer class="sticky bottom-0 bg-bg pt-3 border-t border-border mt-4 text-body" id="promptline">
  <div class="flex items-center gap-2">
    <span class="text-dim">~ $</span>
    <input
      id="terminal-input"
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label="terminal command input"
      class="flex-1 bg-transparent border-0 outline-none text-text font-mono text-body caret-accent"
    />
  </div>
  <div class="text-meta text-dim mt-2">
    try:
    {HINTS.map((h, i) => (
      <>
        {i > 0 && <span> · </span>}
        <button
          type="button"
          data-hint={h}
          class="text-dim hover:text-accent focus:text-accent focus:outline focus:outline-2 focus:outline-accent rounded-sm"
        >{h}</button>
      </>
    ))}
  </div>
</footer>
```

- [ ] **Step 4: Update `src/pages/index.astro` to use the shell**

```astro
---
import '~/styles/global.css';
import Topbar from '~/components/Topbar.astro';
import Hero from '~/components/Hero.astro';
import Promptline from '~/components/Promptline.astro';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>nullkey</title>
    <meta name="description" content="Nullkey — software engineer in Shanghai." />
  </head>
  <body class="bg-bg text-text font-mono">
    <main class="mx-auto max-w-terminal flex flex-col px-4 py-5 sm:px-8 sm:py-6" style="max-height:100svh;height:100svh;">
      <Topbar />
      <Hero />
      <section
        id="summon"
        class="flex-1 overflow-y-auto scroll-thin mt-4"
        aria-live="polite"
        aria-label="terminal output"
      ></section>
      <Promptline />
    </main>
  </body>
</html>
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Expected: a centered terminal-like layout — topbar, ASCII whoami block, empty middle area, prompt line with input + hint buttons. No JS interaction yet, but the input is focusable.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/pages/index.astro
git commit -m "feat: static layout shell (topbar, hero, promptline)"
```

---

## Task 7: Render panel templates from content collections

**Files:**
- Create: `src/components/PanelTemplates.astro`
- Modify: `src/pages/index.astro`

This component renders one `<template>` element per command. The terminal script clones them into the summon area on demand. Rendered at build time, so Markdown becomes static HTML with zero runtime cost.

- [ ] **Step 1: Create `src/components/PanelTemplates.astro`**

```astro
---
import { getCollection, getEntry } from 'astro:content';

const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
const about = await getEntry('about', 'about');
const now = await getEntry('now', 'now');
const uses = await getEntry('uses', 'uses');

const aboutHtml = about ? (await about.render()).Content : null;
const nowHtml   = now   ? (await now.render()).Content   : null;
const usesHtml  = uses  ? (await uses.render()).Content  : null;

const nowUpdated = now?.data.updated
  ? now.data.updated.toISOString().slice(0, 10)
  : null;

const COMMANDS = [
  { cmd: 'about',    label: 'long-form bio' },
  { cmd: 'now',      label: 'what I am doing' },
  { cmd: 'projects', label: 'things I built' },
  { cmd: 'uses',     label: 'hardware & tools' },
  { cmd: 'contact',  label: 'reach me' },
  { cmd: 'whoami',   label: 'the hero block' },
  { cmd: 'clear',    label: 'empty the screen' },
  { cmd: 'help',     label: 'this list' },
];

const CONTACTS = [
  { label: 'github', value: 'github.com/nullkey',   href: 'https://github.com/nullkey' },
  { label: 'x',      value: '@nullkey',             href: 'https://x.com/nullkey' },
  { label: 'email',  value: 'hi@nullkey.dev',       href: 'mailto:hi@nullkey.dev' },
];
---

<!-- whoami: replays hero block -->
<template id="panel-whoami">
  <div class="panel">
    <div class="panel-head"><span><span class="text-accent">▍</span> whoami</span><span class="text-dim">esc to close</span></div>
    <div class="panel-body">
      <p>Nullkey · software engineer · Shanghai</p>
      <p class="font-serif italic text-quote">"I build small, sharp things — sometimes for everyone."</p>
    </div>
  </div>
</template>

<!-- about -->
<template id="panel-about">
  <div class="panel">
    <div class="panel-head"><span><span class="text-accent">▍</span> about</span><span class="text-dim">esc to close</span></div>
    <div class="panel-body prose-panel">
      {aboutHtml && <aboutHtml />}
    </div>
  </div>
</template>

<!-- now -->
<template id="panel-now">
  <div class="panel">
    <div class="panel-head">
      <span><span class="text-accent">▍</span> now</span>
      <span class="text-dim">{nowUpdated ? `updated ${nowUpdated}` : 'esc to close'}</span>
    </div>
    <div class="panel-body prose-panel">
      {nowHtml && <nowHtml />}
    </div>
  </div>
</template>

<!-- projects -->
<template id="panel-projects">
  <div class="panel">
    <div class="panel-head"><span><span class="text-accent">▍</span> projects <span class="text-dim">— {projects.length} results</span></span><span class="text-dim">esc to close</span></div>
    <div class="panel-body">
      {projects.map((p, i) => (
        <div class="project-row" data-index={i + 1}>
          <span class="text-dim">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <div class="text-text">{p.data.name}</div>
            <div class="text-dim text-meta">{p.data.summary}</div>
          </div>
          <span class="text-accent text-meta">{p.data.lang}</span>
        </div>
      ))}
    </div>
  </div>
</template>

<!-- projects detail panels: one per project -->
{projects.map((p, i) => (
  <template id={`panel-projects-${i + 1}`}>
    <div class="panel">
      <div class="panel-head"><span><span class="text-accent">▍</span> projects/{p.data.name}</span><span class="text-dim">esc to close</span></div>
      <div class="panel-body prose-panel">
        <p class="text-meta text-dim">{p.data.lang} · {p.data.repo ?? '—'}</p>
        <p>{p.data.summary}</p>
        <Fragment set:html={p.body} />
        {p.data.repo && <p><a class="text-accent underline" href={p.data.repo}>repo ↗</a></p>}
      </div>
    </div>
  </template>
))}

<!-- uses -->
<template id="panel-uses">
  <div class="panel">
    <div class="panel-head"><span><span class="text-accent">▍</span> uses</span><span class="text-dim">esc to close</span></div>
    <div class="panel-body prose-panel">
      {usesHtml && <usesHtml />}
    </div>
  </div>
</template>

<!-- contact -->
<template id="panel-contact">
  <div class="panel">
    <div class="panel-head"><span><span class="text-accent">▍</span> contact</span><span class="text-dim">↵ to copy · esc to close</span></div>
    <div class="panel-body">
      {CONTACTS.map((c) => (
        <div
          class="contact-row"
          tabindex="0"
          data-copy={c.value}
        >
          <span class="text-dim w-16 inline-block">{c.label}</span>
          <a href={c.href} class="text-text hover:text-accent">{c.value}</a>
        </div>
      ))}
    </div>
  </div>
</template>

<!-- help -->
<template id="panel-help">
  <div class="panel">
    <div class="panel-head"><span><span class="text-accent">▍</span> help</span><span class="text-dim">esc to close</span></div>
    <div class="panel-body">
      {COMMANDS.map((c) => (
        <div class="grid grid-cols-[100px_1fr] gap-4 py-1">
          <span class="text-accent">{c.cmd}</span>
          <span class="text-dim">{c.label}</span>
        </div>
      ))}
    </div>
  </div>
</template>

<!-- unknown -->
<template id="panel-unknown">
  <div class="panel">
    <div class="panel-body text-err">command not found — type 'help'</div>
  </div>
</template>

<!-- easter eggs -->
<template id="panel-sudo">
  <div class="panel">
    <div class="panel-body text-err">Permission denied. nice try.</div>
  </div>
</template>

<template id="panel-pet">
  <div class="panel">
    <div class="panel-body text-dim italic">*purrs* — clove</div>
  </div>
</template>
```

- [ ] **Step 2: Add panel CSS classes to `src/styles/global.css`**

Append to `global.css`:

```css
@layer components {
  .panel {
    border: 1px solid theme('colors.border');
    border-radius: 4px;
    background: theme('colors.bg-raised');
    margin-top: 14px;
    opacity: 0;
    transform: translateY(4px);
    animation: panel-in 200ms ease-out forwards;
  }
  @keyframes panel-in {
    to { opacity: 1; transform: translateY(0); }
  }
  .panel-head {
    display: flex;
    justify-content: space-between;
    padding: 8px 14px;
    border-bottom: 1px solid theme('colors.border');
    font-size: 12px;
    color: theme('colors.dim');
  }
  .panel-body {
    padding: 10px 14px;
  }
  .prose-panel p { margin: 0.5em 0; }
  .prose-panel h3 {
    color: theme('colors.accent');
    font-size: 13px;
    margin: 1em 0 0.3em;
  }
  .prose-panel ul { margin: 0.3em 0 0.8em; padding-left: 1.2em; }
  .prose-panel li { color: theme('colors.text'); }
  .prose-panel a { color: theme('colors.accent'); text-decoration: underline; }
  .prose-panel em { font-family: theme('fontFamily.serif'); font-style: italic; font-size: 16px; }
  .prose-panel blockquote {
    margin: 0.8em 0;
    padding-left: 1em;
    border-left: 2px solid theme('colors.border');
    font-family: theme('fontFamily.serif');
    font-style: italic;
    font-size: 16px;
  }

  .project-row {
    display: grid;
    grid-template-columns: 28px 1fr 70px;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px dashed theme('colors.border');
    align-items: baseline;
  }
  .project-row:last-child { border-bottom: none; }

  .contact-row {
    padding: 8px 14px;
    border-bottom: 1px dashed theme('colors.border');
    cursor: pointer;
  }
  .contact-row:last-child { border-bottom: none; }
  .contact-row:focus {
    outline: 2px solid theme('colors.accent');
    outline-offset: -2px;
  }
}

@media (max-width: 640px) {
  .project-row {
    grid-template-columns: 28px 1fr;
  }
  .project-row > span:last-child {
    grid-column: 2;
  }
}
```

- [ ] **Step 3: Mount `PanelTemplates` in `index.astro`**

In `src/pages/index.astro`, add the import and place the component just before `</body>`:

```astro
---
import '~/styles/global.css';
import Topbar from '~/components/Topbar.astro';
import Hero from '~/components/Hero.astro';
import Promptline from '~/components/Promptline.astro';
import PanelTemplates from '~/components/PanelTemplates.astro';
---
```

And before `</body>`:

```astro
    <PanelTemplates />
  </body>
```

- [ ] **Step 4: Verify build**

```bash
npm run dev
```

Expected: page renders unchanged visually (templates are hidden by default), no console errors. Open DevTools → Elements and confirm `<template id="panel-projects">` etc. exist in the DOM.

- [ ] **Step 5: Commit**

```bash
git add src/components/PanelTemplates.astro src/styles/global.css src/pages/index.astro
git commit -m "feat: render panel templates from content collections"
```

---

## Task 8: Terminal client script — input, dispatch, history

**Files:**
- Create: `src/scripts/terminal.ts`
- Modify: `src/pages/index.astro`

The script wires the input to the parser, clones templates into the summon area, and emits `terminal:*` custom events for the mascot.

- [ ] **Step 1: Create `src/scripts/terminal.ts`**

```ts
import { parseCommand, type ParsedCommand } from '~/lib/commands';

const input = document.getElementById('terminal-input') as HTMLInputElement | null;
const summon = document.getElementById('summon');
if (!input || !summon) {
  throw new Error('terminal: missing #terminal-input or #summon');
}

const history: string[] = [];
let historyIdx = -1;

function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function getTemplate(id: string): DocumentFragment | null {
  const tpl = document.getElementById(id) as HTMLTemplateElement | null;
  return tpl ? (tpl.content.cloneNode(true) as DocumentFragment) : null;
}

function summonPanel(id: string) {
  const frag = getTemplate(id);
  if (!frag) return;
  summon!.replaceChildren(frag);
  summon!.scrollTop = summon!.scrollHeight;
  emit('terminal:summon', { id });
}

function dispatch(parsed: ParsedCommand) {
  switch (parsed.kind) {
    case 'noop':
      return;
    case 'clear':
      summon!.replaceChildren();
      return;
    case 'panel': {
      if (parsed.name === 'projects' && parsed.arg) {
        summonPanel(`panel-projects-${parsed.arg}`);
      } else {
        summonPanel(`panel-${parsed.name}`);
      }
      return;
    }
    case 'easter':
      summonPanel(`panel-${parsed.name}`);
      if (parsed.name === 'pet') emit('terminal:pet');
      return;
    case 'unknown':
      summonPanel('panel-unknown');
      emit('terminal:unknown', { input: parsed.input });
      return;
  }
}

function runRaw(raw: string) {
  if (raw.trim() !== '') {
    history.push(raw);
    historyIdx = history.length;
  }
  dispatch(parseCommand(raw));
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    runRaw(value);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (history.length === 0) return;
    historyIdx = Math.max(0, historyIdx - 1);
    input.value = history[historyIdx] ?? '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (history.length === 0) return;
    historyIdx = Math.min(history.length, historyIdx + 1);
    input.value = history[historyIdx] ?? '';
  } else if (e.key === 'Escape') {
    e.preventDefault();
    summon!.replaceChildren();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const candidates = ['about', 'now', 'projects', 'uses', 'contact', 'help', 'clear', 'whoami'];
    const match = candidates.find((c) => c.startsWith(input.value.toLowerCase()));
    if (match) input.value = match;
  }
});

input.addEventListener('input', () => emit('terminal:type'));

// Refocus input on any click outside selection
document.addEventListener('click', (e) => {
  const sel = window.getSelection();
  if (sel && sel.toString().length > 0) return;
  // Don't steal focus from buttons / links
  const target = e.target as HTMLElement;
  if (target.closest('button, a, [tabindex="0"]')) return;
  input.focus();
});

// Clickable hint buttons in promptline
document.querySelectorAll<HTMLButtonElement>('#promptline button[data-hint]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.hint!;
    runRaw(cmd);
    input.focus();
  });
});

// Contact row copy-on-Enter
summon.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const target = e.target as HTMLElement;
  const row = target.closest<HTMLElement>('.contact-row');
  if (!row) return;
  const value = row.dataset.copy;
  if (!value) return;
  navigator.clipboard?.writeText(value);
  const old = row.innerHTML;
  row.innerHTML = `<span class="text-ok">copied ✓</span>`;
  setTimeout(() => { row.innerHTML = old; }, 1500);
});

// Typewriter intro: skip if reduced motion
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  // The hero is server-rendered; just fade-in the prompt cursor.
  // (Full typewriter on the hero would require restructuring; leave for v2.)
}

input.focus();
```

- [ ] **Step 2: Wire script into `index.astro`**

In `src/pages/index.astro`, just before `</body>` (after `<PanelTemplates />`):

```astro
    <PanelTemplates />
    <script>
      import '~/scripts/terminal.ts';
    </script>
  </body>
```

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Open browser. Verify:
- Input is auto-focused
- Type `projects` + Enter → projects panel appears
- Type `projects 1` + Enter → vibeknow detail appears (replaces previous panel)
- Type `about`, `now`, `uses`, `contact`, `help` — each summons the right panel
- Type `clear` → summon area empties
- Type `foo` → red "command not found" line
- Type `sudo rm -rf /` → "Permission denied. nice try."
- Type `pet` → "*purrs* — clove"
- Press ↑/↓ → cycles command history
- Press Tab after `pr` → completes to `projects`
- Press Esc → closes current panel
- Click a hint button (e.g., `now`) → runs that command
- Click anywhere on the page → input refocuses

- [ ] **Step 4: Commit**

```bash
git add src/scripts/terminal.ts src/pages/index.astro
git commit -m "feat: terminal repl client script"
```

---

## Task 9: Mascot — placeholder SVG + state script

**Files:**
- Create: `src/components/Mascot.astro`, `src/scripts/mascot.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/Mascot.astro`**

Inline SVG so it's part of the document and can be styled/animated by CSS without a network request. Placeholder is a simple round blob with two eyes — spec §11 explicitly allows shipping with placeholder art.

```astro
---
---
<div
  id="mascot"
  class="fixed bottom-6 right-6 w-24 h-24 z-20 pointer-events-auto select-none"
  aria-hidden="true"
>
  <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-lg" id="mascot-svg">
    <!-- body -->
    <ellipse cx="50" cy="58" rx="38" ry="32" fill="#d97757" />
    <!-- subtle highlight -->
    <ellipse cx="38" cy="42" rx="10" ry="6" fill="#e6906f" opacity="0.6" />
    <!-- left eye -->
    <circle id="mascot-eye-l" cx="38" cy="55" r="4" fill="#1a1613" />
    <!-- right eye -->
    <circle id="mascot-eye-r" cx="62" cy="55" r="4" fill="#1a1613" />
    <!-- closed eyelids (hidden by default) -->
    <rect id="mascot-lids" x="32" y="53" width="36" height="2" fill="#1a1613" opacity="0" rx="1" />
  </svg>
  <div
    id="mascot-bubble"
    class="absolute -top-8 right-0 text-meta text-dim bg-bg-raised border border-border rounded-sm px-2 py-1 opacity-0 pointer-events-none whitespace-nowrap transition-opacity"
  ></div>
</div>

<style>
  #mascot-svg {
    transform-origin: center 70%;
    animation: mascot-breathe 4s ease-in-out infinite;
  }
  @keyframes mascot-breathe {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.02); }
  }
  @media (prefers-reduced-motion: reduce) {
    #mascot-svg { animation: none; }
  }
  #mascot.hop #mascot-svg {
    animation: mascot-hop 280ms ease-out;
  }
  @keyframes mascot-hop {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }
</style>
```

- [ ] **Step 2: Create `src/scripts/mascot.ts`**

```ts
const root = document.getElementById('mascot');
const svg = document.getElementById('mascot-svg');
const lids = document.getElementById('mascot-lids');
const eyeL = document.getElementById('mascot-eye-l');
const eyeR = document.getElementById('mascot-eye-r');
const bubble = document.getElementById('mascot-bubble');

if (!root || !svg || !lids || !eyeL || !eyeR || !bubble) {
  throw new Error('mascot: missing nodes');
}

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function blink() {
  if (reduce) return;
  lids!.setAttribute('opacity', '1');
  eyeL!.setAttribute('opacity', '0');
  eyeR!.setAttribute('opacity', '0');
  setTimeout(() => {
    lids!.setAttribute('opacity', '0');
    eyeL!.setAttribute('opacity', '1');
    eyeR!.setAttribute('opacity', '1');
  }, 140);
}
if (!reduce) setInterval(blink, 8000);

function lookLeft() {
  if (reduce) return;
  eyeL!.setAttribute('cx', '36');
  eyeR!.setAttribute('cx', '60');
  setTimeout(() => {
    eyeL!.setAttribute('cx', '38');
    eyeR!.setAttribute('cx', '62');
  }, 600);
}

function coverEyes() {
  if (reduce) return;
  lids!.setAttribute('opacity', '1');
  eyeL!.setAttribute('opacity', '0');
  eyeR!.setAttribute('opacity', '0');
  setTimeout(() => {
    lids!.setAttribute('opacity', '0');
    eyeL!.setAttribute('opacity', '1');
    eyeR!.setAttribute('opacity', '1');
  }, 600);
}

function hop() {
  if (reduce) return;
  root!.classList.add('hop');
  setTimeout(() => root!.classList.remove('hop'), 280);
}

function showBubble(text: string, ms = 1500) {
  bubble!.textContent = text;
  bubble!.style.opacity = '1';
  setTimeout(() => { bubble!.style.opacity = '0'; }, ms);
}

function popHeart() {
  const heart = document.createElement('div');
  heart.textContent = '♥';
  heart.style.cssText =
    'position:absolute;top:-12px;left:50%;transform:translateX(-50%);' +
    'color:#d97757;font-size:18px;opacity:1;transition:all 1s ease-out;';
  root!.appendChild(heart);
  requestAnimationFrame(() => {
    heart.style.opacity = '0';
    heart.style.transform = 'translate(-50%,-20px)';
  });
  setTimeout(() => heart.remove(), 1100);
}

window.addEventListener('terminal:type', lookLeft);
window.addEventListener('terminal:summon', hop);
window.addEventListener('terminal:unknown', coverEyes);
window.addEventListener('terminal:pet', () => { hop(); popHeart(); });

root.addEventListener('mouseenter', () => showBubble('hi.'));
root.addEventListener('click', () => showBubble('try: pet'));
```

- [ ] **Step 3: Wire mascot into `index.astro`**

In `src/pages/index.astro`, add the import:

```astro
---
import '~/styles/global.css';
import Topbar from '~/components/Topbar.astro';
import Hero from '~/components/Hero.astro';
import Promptline from '~/components/Promptline.astro';
import PanelTemplates from '~/components/PanelTemplates.astro';
import Mascot from '~/components/Mascot.astro';
---
```

And before `</body>`:

```astro
    <PanelTemplates />
    <Mascot />
    <script>
      import '~/scripts/terminal.ts';
      import '~/scripts/mascot.ts';
    </script>
  </body>
```

- [ ] **Step 4: Manual verification**

```bash
npm run dev
```

Verify:
- Orange blob with two eyes appears bottom-right
- Slow breathing animation
- Blinks every 8s
- Hover → bubble "hi."
- Click → bubble "try: pet"
- Type in terminal → eyes shift left
- Run a command → mascot hops
- Run unknown command → mascot covers eyes
- Run `pet` → mascot hops + heart pops above head

- [ ] **Step 5: Commit**

```bash
git add src/components/Mascot.astro src/scripts/mascot.ts src/pages/index.astro
git commit -m "feat: mascot with placeholder svg and state script"
```

---

## Task 10: Accessibility, reduced motion, and final polish

**Files:**
- Modify: `src/scripts/terminal.ts`, `src/pages/index.astro`, `src/styles/global.css`

- [ ] **Step 1: Verify focus rings exist on all interactive elements**

Check:
- Promptline hint buttons have visible focus ring (already in Task 6)
- Contact rows have focus outline (already in Task 7 CSS)
- Terminal input has caret-accent (already in Task 6)

If any are missing, add `focus:outline focus:outline-2 focus:outline-accent` utility.

- [ ] **Step 2: Add `lang` and meta description**

Already in place from Task 6 — verify `<html lang="en">` and `<meta name="description">` are present in `src/pages/index.astro`.

- [ ] **Step 3: Verify reduced-motion path**

In Chrome DevTools → Rendering → "Emulate CSS media feature `prefers-reduced-motion`" → set to `reduce`.

Reload. Verify:
- Mascot stops breathing
- Mascot does not blink, hop, or cover eyes
- Panel transitions become instant
- Page is still fully usable

- [ ] **Step 4: Verify keyboard-only navigation**

With keyboard only (no mouse):
- Tab from address bar lands on terminal input
- Tab from input → first hint button → next hint → ...
- Enter on a hint button runs the command
- After running `contact`, Tab into the panel and Enter on a row copies the value

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: build succeeds, `dist/` contains `index.html` plus a small JS bundle. No errors.

- [ ] **Step 6: Preview production build**

```bash
npm run preview
```

Open the preview URL and re-run the smoke test from Task 8 Step 3 against the production build.

- [ ] **Step 7: Check JS bundle size**

```bash
du -sh dist/_astro/*.js
```

Expected: total JS under 25kb (uncompressed under ~80kb is typical for this bundle size after gzip). If significantly larger, investigate (most likely culprit is accidentally including a framework runtime).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: verify a11y, reduced motion, and production build"
```

---

## Task 11: README and final commit

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write minimal README**

```markdown
# homepage

Personal site. A REPL that doubles as a name card.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve dist/ locally
```

## Edit content

All copy lives in `src/content/`. Edit Markdown, save, refresh.

- `src/content/about/about.md` — long bio
- `src/content/now/now.md` — what I'm doing now (set `updated` in frontmatter)
- `src/content/uses/uses.md` — hardware & tools
- `src/content/projects/*.md` — one file per project, ordered by `order` frontmatter field

## Test

```bash
npm test
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add readme"
```

---

## Done criteria

- [ ] `npm run dev` shows the page; all 9 commands behave per spec §4
- [ ] `npm test` is green
- [ ] `npm run build` succeeds; preview matches dev
- [ ] Mascot animates and reacts to terminal events
- [ ] Reduced motion fully respected
- [ ] Keyboard-only navigation works end-to-end
- [ ] Total shipped JS ≤25kb gzipped
