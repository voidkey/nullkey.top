---
title: hello, world
date: 2026-04-07
summary: the first post on this site, mostly to prove the pipe works
tags: [meta]
draft: false
---

this is the first post on this site. it exists mostly to prove the pipe works.

if you're reading this in a serif-typeset reading view inside a CRT-flavored
shell, that means everything from `posts` → `read hello-world` → render → router
is wired up correctly.

## what to expect here

short notes, mostly about software i'm building or thinking about. things
worth writing down but not worth tweeting. essays when something deserves
the longer form.

no fixed schedule. no newsletter. just files in a folder under git.

## how it works

every post is a markdown file in `src/content/posts/`. push to `main`,
cloudflare rebuilds the site, the post goes live in about 30 seconds.

```bash
cd ~/project/homepage
echo "# new thoughts" > src/content/posts/2026-04-08-thoughts.md
git add . && git commit -m "post: new thoughts" && git push
```

that's the whole CMS.

> the best workflow is the one you forget you have.

press **esc** or click `❮ back to home` to return to the terminal.
