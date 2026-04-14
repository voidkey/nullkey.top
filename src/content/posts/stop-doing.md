---
title: what can i stop doing
date: 2026-04-14
summary: notes on anthropic's "harnessing claude's intelligence" and the weird job of building on something that keeps getting better
tags: [essay, ai, agents]
draft: false
---

*notes on [anthropic's post](https://claude.com/blog/harnessing-claudes-intelligence)
and the weird job of building on something that keeps getting better.*

chris olah says generative models are grown, not built. researchers set
the conditions; what grows out of them isn't fully known in advance. I
keep turning that over, because it changes what "engineering" means when
the thing under your code is a moving target.

## the assumption problem

every agent harness i've ever written encodes a sentence of the form
*"claude can't do X, so i'll do X for it."* that sentence is fine the day
you write it. the problem is that claude gets better, and the sentence
doesn't. the scaffolding stays. eventually you're paying latency and
tokens to work around a limitation that stopped existing two model
versions ago.

anthropic has a name for this in the post: dead weight. and a question
to cut it with:

> what can i stop doing?

that's the whole frame. not "what feature should i add." *what load-bearing
assumption have i outgrown.*

## three places the assumption shows up

the post gives three patterns. i'll say them in my own words.

**1. use tools claude already knows.** bash and a text editor got 3.5 sonnet
to 49% on swe-bench. claude code is still built on them. skills, memory,
programmatic tool calling — all compositions of the same two primitives.
inventing a bespoke tool shape for your app means claude meets it for
the first time at inference; picking bash means you get every future
training run for free.

**2. let claude do the orchestration.** the default harness pipes every
tool result back through the context window so the model can "decide
what's next." that made sense when the model was the bottleneck. now
the bottleneck is often the context itself — tokens you paid for, rows
you didn't need. give it code execution and it'll write the glue: filter,
pipe, branch. only the final answer hits the context. on browsecomp,
this one change took opus from 45% to 62%.

**3. let claude manage and persist its own context.** skills with yaml
frontmatter are a tiny index; the body gets read on demand. memory folders
let the model choose what to write down. the pokémon example in the post
is the clearest thing i've read about why this matters: sonnet 3.5 wrote
down npc dialogue like a transcript; opus 4.6 wrote a `learnings.md`
distilled from its own failures. same tool. different judgment.

## the part that actually stung

deep in the post there's a small confession. they'd built context resets
into a long-horizon agent to handle sonnet 4.5's "context anxiety" — the
model would wrap up prematurely when it sensed the window filling. opus
4.5 just... didn't do that anymore. the reset mechanism, the careful
plumbing around it, all of it had become dead weight.

this is the shape of the whole problem. you build a workaround. it
works. then one day it's worse than nothing, and the only signal that
it's worse than nothing is a benchmark you're probably not running.

## what i'm taking from this

i've been writing claude-based tooling the way i write regular software:
add abstractions when they help, leave them there when they don't hurt.
that rule is wrong here. in a growing system, *abstractions that don't
hurt today will hurt tomorrow*, because the floor is rising under them.

so i'm trying a different habit. every time i reach for a structural
piece — a custom tool, a retrieval layer, a prompt template, a "just in
case" guardrail — i want to ask:

- what can't claude do that makes this necessary?
- how do i know that's still true?
- what would it cost me to find out?

and on the other side, the bitter lesson the post quotes at the end:
structure that compensates for missing capability eventually bottlenecks
the capability that arrives to replace it. the kindest thing you can do
to a model that's getting smarter is get out of its way.

> the best harness is the one you keep deleting from.

i don't have this figured out. but "what can i stop doing" is a better
question than the one i've been asking.
