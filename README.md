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
