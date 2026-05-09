---
title: the prefix is load-bearing
date: 2026-05-09
summary: notes on anthropic's "prompt caching is everything" — what changes when the cache stops being an optimization and becomes the foundation
tags: [essay, ai, agents, infra]
draft: false
---

*notes on [anthropic's post on prompt caching in claude code](https://claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything).*

most engineers learn caching as an optimization. you build the thing,
profile it, find the hot path, slot a cache in front. the cache is a
layer. you can take it out and the system still works, just slower.

the claude code post is about a different shape of the same word. their
cache isn't a layer on top of the harness — it's the foundation under
it. every architectural decision they describe is downstream of one
constraint: the cache is a prefix match, and any byte you change in the
prefix invalidates everything after it.

once you take that seriously, a lot of normal software intuitions stop
working.

## intuition vs. constraint

here is a list of things engineers normally do, that you cannot do once
the prefix is load-bearing:

- edit the system prompt when state changes (timestamps, current file,
  mode flags)
- swap the tool set based on context ("just give it what it needs right
  now")
- switch to a cheaper model for easier sub-tasks
- spin up a side call with its own minimal prompt to summarize, classify,
  or compact

each of these is the obvious move in a normal codebase. each of them
blows the cache. the longer the conversation, the more it hurts —
exactly when you most needed the savings.

the trick isn't to avoid these operations. you still need them. the
trick is to express them without touching the prefix.

## append, don't mutate

the principle that emerges is almost embarrassingly old. it's the same
principle behind event sourcing, write-ahead logs, immutable data
structures, append-only files. *mutation is expensive; append is cheap.*

every cache-friendly pattern in the post is a different shape of that
one idea:

- need to tell the model the time changed? don't edit the system prompt
  — append a `<system-reminder>` in the next user message.
- need to enter "plan mode"? don't filter the tool list — keep the full
  set, and append a tool call (`EnterPlanMode`) that tells the model how
  to behave.
- need to defer expensive tool schemas? don't remove them — keep the
  same stubs in the same order, and load the bodies on demand via
  `defer_loading`.
- need to compact? don't fork to a different system prompt — copy the
  parent's prefix exactly, and append the compaction instruction at the
  end.

in each case, the cached prefix is treated as immutable. new information
goes at the seam.

## the operation that looks free but isn't

the example that lands hardest is compaction.

the naive way to summarize a long conversation is a fresh api call: a
small focused system prompt ("summarize this"), no tools, the
conversation as input. it *looks* cheaper than the original — fewer
tools, simpler prompt. it's the move you'd make in any other codebase.

it's also the most expensive call you'll make all day.

the new request shares no prefix with the cached one. tools differ.
system prompt differs. the divergence happens at token zero. so you pay
the full uncached input rate for the entire conversation you were trying
to summarize *precisely because it got long*. the operation that's
supposed to relieve cost-of-context becomes the worst offender of it.

the fix is counterintuitive: keep the parent's full system prompt and
all its tools, redundant as that feels for a summarization task, and
append the compaction prompt as a new user message. the request looks
bloated. the bill says otherwise.

it's a small, beautiful illustration of the larger rule. when caching is
a layer, "leaner request = cheaper request" holds. when caching is the
foundation, the question is no longer "how small can i make this call"
but "how much of this call already lives in the cache."

## tools as state, not configuration

the plan-mode design is the part i keep coming back to.

the obvious implementation is: when the user toggles plan mode, restrict
the tool set to read-only ones. that's how you'd build it in any other
product. permissions live in configuration; configuration is something
you change.

claude code instead models the mode as a *tool call*. `EnterPlanMode`
and `ExitPlanMode` are tools the model can invoke. the tool set never
changes. the state lives in the conversation history, not in the request
shape.

there's a side effect that makes this elegant rather than merely
expedient: because the mode transition is now a thing the model can do,
the model can enter plan mode on its own when it senses a hard problem.
the cache constraint forced a redesign that made the feature *better*.

this is the pattern worth stealing even outside agents: *push state
changes from configuration into the message stream.* configuration is
mutable; messages are append-only. anything you can express as a message
instead of a config flag becomes cheap to evolve.

## what i'm watching for in my own code

i had a small wave of recognition reading this post. nearly every
claude-based tool i've written has at least one of these mistakes in it:

- a system prompt that gets re-rendered each turn with a fresh timestamp
- a tool list filtered "for the model's own good" based on which mode
  the user is in
- a smart router that switches to a smaller model for trivial sub-tasks
- a summarization step with its own minimal prompt, run as a separate
  call

each of those was the obvious call when i wrote it. each of them is, on
this analysis, a slow leak. the worst part is none of them show up as
bugs. the system works. the bill just gets bigger and latency creeps up,
and the signal is too diffuse to chase down without the right
monitoring — which is exactly why anthropic alerts on cache hit rate and
treats drops as incidents.

so the habit i want is this: *treat the cached prefix like a public
api.* changes to it are breaking changes. they cost something real.
before mutating it, ask whether the same effect can be expressed by
appending to the conversation instead.

> the cache isn't an optimization. it's the contract.

build to the contract first; the rest of the harness follows.
