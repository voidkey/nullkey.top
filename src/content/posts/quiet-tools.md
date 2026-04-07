---
title: on quiet tools
date: 2026-04-05
summary: notes on building software that doesn't shout
tags: [essay, craft]
draft: false
---

*notes on building software that doesn't shout.*

a quiet tool is one you forget you're using. it doesn't ask for attention,
doesn't celebrate its own cleverness, doesn't need a tour. it just sits
under your hands and gets out of the way.

## why bother

most software is loud. modals, toasts, onboarding flows, "what's new" cards.
each one is a small tax on the person trying to think. when you stack
enough of them, the tool stops being a tool and starts being a relationship
you have to maintain.

> the best interface is the one you stop noticing.

## three rules i try to keep

1. **default to silence.** if a thing doesn't need to be said, don't say it.
2. **respect the keyboard.** anyone who shows up via the terminal is telling
   you something about how they want to work. listen.
3. **prefer one good path** over three mediocre ones. options are a kind of debt.

## what this looks like in code

```go
// bad: announces itself on the happy path
log.Printf("starting handler for request %s", r.ID)
result := handle(r)
log.Printf("handler %s done", r.ID)

// better: silent on the happy path
if err := handle(r); err != nil {
    log.Printf("handler %s failed: %v", r.ID, err)
}
```

silence on success. noise only when it earns it.

## what this looks like in design

a button that doesn't celebrate itself when you click it. a form that
doesn't congratulate you for entering your email. an empty state that
just *is* empty, instead of explaining why.

i don't always get this right. but it's the direction i'm walking in.
