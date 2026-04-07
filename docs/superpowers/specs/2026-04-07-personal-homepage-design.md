# Personal Homepage — Design Spec

**Date:** 2026-04-07
**Owner:** nullkey
**Status:** Approved (brainstorm)

## 1. Goal

A single-page personal homepage that works as a name card. Visual language follows **Claude Code**: warm dark, mono-first, terracotta accent, ASCII/border details. The page itself is a playful artifact — a REPL that doubles as a business card. Static screenshot must read as calm and minimal; the geek shows up only when you start typing.

**Non-goals:** blog, real-time stats dashboard, multi-page site, CMS.

## 2. Stack

- **Astro** + **Tailwind CSS**
- Single route: `/`
- Content via Astro **content collections** (Markdown), so editing copy never touches code
- **Zero JS by default.** The terminal is one client island (`client:load`); everything else ships as static HTML
- Deploy: Vercel or Cloudflare Pages (static)

## 3. Page Structure

One viewport, no body scroll. Internal scroll lives inside the summon area only.

```
┌─ topbar (sticky top): nullkey@homepage ~ main          ● connected
│
│  ┌─ whoami (ASCII box, decorative)
│  │  Nullkey · software engineer · Shanghai
│  │  "I build small, sharp things..."  ← Georgia italic
│  └─ ok (0.04s)
│
│  [summon area — empty by default; panels render here, internal scroll]
│
└─ promptline (sticky bottom): ~ $ ▍   try: about · now · projects · uses · contact · help
```

- Container: centered, `width: min(760px, 92vw)`, `max-height: 100svh`, vertical flex
- Topbar: sticky top inside container
- Promptline: sticky bottom inside container
- Summon area: `flex: 1`, `overflow-y: auto`, custom thin dark scrollbar

### Load sequence

1. Topbar fades in instantly
2. `whoami` block types out line-by-line (~40ms/char, skippable by any keypress)
3. Promptline appears with cursor; input auto-focuses
4. Clicking anywhere on the page refocuses the input

## 4. Commands

| Command | Behavior |
|---|---|
| `whoami` | Replays the hero block in the summon area |
| `about` | Summons About panel (long bio, occasional Georgia italic pull-quote) |
| `now` | Summons Now panel; last-updated date in panel header |
| `projects` | Summons project list (index / name / description / language) |
| `projects <n>` | Expands the nth project's detail panel |
| `uses` | Summons Uses panel grouped: Hardware / Editor / CLI / Daily |
| `contact` | Summons contact panel; github / x / email; press ↵ on a row to copy |
| `help` | Lists all commands |
| `clear` | Empties the summon area |
| `sudo *` | Easter egg: `Permission denied. nice try.` |

**Keys:** `↑ / ↓` history, `Tab` complete, `Esc` close current panel, `Enter` submit.

**Unknown command:** `command not found: xxx — type 'help'` rendered in `err` color.

**Clickable hint commands:** Each command name in the promptline `try:` hint is clickable and equivalent to typing the command + Enter. This is the fallback for visitors who don't realize it's interactive.

## 5. Visual Language

### Color tokens (Tailwind config)

| Token | Value | Use |
|---|---|---|
| `bg` | `#1a1613` | Page background |
| `bg-raised` | `#211b16` | Panel background |
| `border` | `#2d2620` | All borders & dividers |
| `text` | `#e8e1d6` | Primary text |
| `dim` | `#8a7f6f` | Metadata, prompt symbol, hints (≥4.5:1 on `bg`) |
| `accent` | `#d97757` | Command names, cursor, emphasis |
| `ok` | `#a7c080` | Success status |
| `err` | `#e06c75` | Error line |

### Type

- **Mono (default everywhere):** `JetBrains Mono` (self-hosted via `@fontsource/jetbrains-mono`) → `SF Mono` → `ui-monospace` → `monospace`
- **Serif (decorative only):** `Georgia, serif` — system font, zero network. Used **only** for hero pull-quote and bio pull-quotes, **always italic**

### Sizes

| Element | Size |
|---|---|
| Hero name line | 15px |
| Body | 13px |
| Metadata / hints | 12px |
| Pull-quote (italic Georgia) | 16px |
| `line-height` | 1.7 |

### Borders & decoration

**Rule: decoration uses ASCII box-drawing characters; structure uses CSS 1px borders.**

- Hero `whoami` block → ASCII frame (`┌─ │ └─`)
- Topbar, promptline, summon panels → CSS `1px solid border` token
- Corners: `rounded-sm` (4px) max, never larger
- Dividers inside panels: `border-dashed` in `border` token

### Spacing

- Box padding: `28px 32px`
- Row padding: `10px 14px`
- Section gap: `14px`

## 6. Panels

All summon panels share a common shell:

```
┌─ panel-head: ▍ <name>  — <meta>          esc to close
│  panel-body: rows or prose
└─
```

Transitions: 200ms fade + 4px translateY between panels. New command replaces existing panel.

### projects panel

Grid columns: `[idx 22px] [name+desc 1fr] [lang 90px]` — **stars column intentionally omitted** (info is one click away on GitHub; keeps the row uncluttered).

```
01  vibeknow                                           go
    a knowledge base that talks back, built on local LLMs

02  openclaw                                           ts
    browser-driving agent runtime for everyday automation
```

`projects 1` expands a detail view: longer description, links (repo / demo), tech list.

### about panel

Long-form prose, single column. Pull-quotes wrapped in `<em>` and styled Georgia italic 16px.

### now panel

Loaded from `now.md`. Header shows `updated YYYY-MM-DD` from frontmatter, right-aligned in `dim`.

### uses panel

Four sub-sections (Hardware / Editor / CLI / Daily) as nested mini-tables, each row: `name — note`.

### contact panel

Three rows: github / x / email. Each row focusable; Enter copies the value to clipboard and shows `copied ✓` for 1.5s in `ok`.

## 7. Content Collections

```
src/content/
  about.md        # frontmatter: none. Body = prose.
  now.md          # frontmatter: updated (date). Body = prose.
  uses.md         # frontmatter: none. Body = grouped lists.
  projects/
    vibeknow.md   # frontmatter: name, lang, repo, demo?, summary. Body = detail prose.
    openclaw.md
    ...
```

Order of projects: explicit `order` field in frontmatter, ascending.

## 8. Responsive

| Breakpoint | Behavior |
|---|---|
| ≥640px | Spec as written above |
| <640px | Container padding `20px 16px`; project rows stack to two lines (name+desc / lang); ASCII frame on hero kept (it still fits at 13px mono) |

Container max-height uses `100svh` (small viewport height) so mobile address bar doesn't clip the promptline.

## 9. Accessibility

- Input has `aria-label="terminal command input"`, autofocus on mount
- Focus trap: clicking anywhere in the container refocuses the input (except when text is selected)
- All clickable hint commands are real `<button>` elements with visible focus rings (`accent` color, 2px outline)
- Color contrast: all text ≥4.5:1 on its background (verified for `text`, `dim`, `accent`, `ok`, `err` against `bg` and `bg-raised`)
- Reduced motion: if `prefers-reduced-motion: reduce`, the typewriter intro is skipped (content appears instantly) and panel transitions become instant
- Keyboard-only navigable end-to-end (it's a terminal — that's the whole point)

## 10. Performance Targets

- Lighthouse Performance ≥95 on mobile
- Total JS shipped ≤25kb gzipped (terminal island only)
- LCP <1.0s on fast 3G
- Self-hosted JetBrains Mono subset (Latin only), `font-display: swap`

## 11. Mascot

A single illustrated companion lives in the bottom-right corner of the viewport — the **only** rendered (non-mono, non-ASCII) element on the entire page. The contrast is the point: everything is a CLI… except this small creature watching you use it.

### Form

- Position: `fixed`, `bottom: 24px`, `right: 24px`, outside the terminal container, above all other content
- ~96px tall, **SVG** (avoid raster blur on retina)
- Body color: `accent` (`#d97757`) — same token as the cursor, so the page only ever uses one warm color
- Matte, sticker-like rendering. No glassmorphism, no gradients beyond a soft drop shadow
- Asset is **TBD** — ship v1 with a placeholder SVG (a simple orange blob with two dots for eyes) and swap in the real illustration later. Spec does not block on the final art.

### States

| Trigger | Reaction |
|---|---|
| Idle | Slow breathing (`scale 1 ↔ 1.02`, 4s loop); blink every 8s |
| User starts typing in terminal | Eyes track toward the cursor |
| `help` command | Head tilts |
| Unknown command / `sudo *` | Covers eyes for 0.6s |
| Panel summon (200ms transition) | Tiny hop |
| Mouse hover | Mono speech bubble: `hi.` |
| Click | Bubble swaps to: `try: pet` |
| Hidden `pet` command | Small orange heart pops above its head, fades in 1s |
| `prefers-reduced-motion: reduce` | Fully static; no breathing, no blink, no hops |

### Implementation

- Separate Astro client island: `<Mascot client:idle />` (`client:idle` because it's non-essential)
- Budget: ~2kb JS gzipped on top of the terminal island
- States are CSS-driven where possible (breathing, blink); JS only for event-triggered states

### What the mascot does NOT do

- Does **not** appear inside the terminal, hero, or any panel
- Does **not** speak in long sentences or guide/teach the user
- Does **not** serve as a loading spinner (that's a side effect of one state, not its job)
- Does **not** add any new colors to the palette

### Hidden command additions to §4

Add row to commands table:

| `pet` | Triggers the mascot's heart animation. Prints `*purrs* — clove` in `dim`. |

(Mascot name is provisional: `clove`. Subject to user's preference.)

## 12. Out of Scope

- Blog / writing module
- Live stats (GitHub graph, now-playing, etc.)
- Light theme
- i18n
- Analytics
- Multi-page routing
