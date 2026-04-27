---
title: tools are not apis
date: 2026-04-27
summary: notes on anthropic's mcp-in-production post — and why two well-chosen tools beat two thousand mirrored endpoints
tags: [essay, ai, agents]
draft: false
---

*notes on [anthropic's post on building agents that reach production
systems with mcp](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp),
following the same thread as stop-doing and three-shapes.*

cloudflare's reference mcp server exposes around 2,500 api endpoints.
it does this with 2 tools.

i had to read that twice. the obvious move — the thing every "expose
your api as tools" tutorial does — is one tool per endpoint. that gives
you 2,500 tool definitions, all of them in the model's context, all of
them lobbying for attention, none of them composable. it's the agent
equivalent of a config file with 2,500 keys.

the cloudflare server does the opposite. two thin entry points — one
for code execution, one for resource discovery — and the model writes
the glue. the api is still 2,500 endpoints. the *tool surface* is two.

## the assumption being broken

i used to think "good tool design" meant: pick clear names, write clear
descriptions, mirror the underlying api faithfully so the model knows
what's available. faithfulness was the goal.

this post quietly reframes it. tools are not an inventory of what your
service can do. they're **affordances chosen for the model** — handles
shaped to fit the way an agent reaches for things.

an api is for any caller. a tool is for *this* caller, with *this*
context window, *this* token budget, *this* habit of writing code to
solve problems. mirroring the api ignores everything that makes the
caller specific.

> a thin tool surface bets on the model's ability to compose.

## why thin works now

a couple of years ago this would have been a worse bet. you'd want
hand-shaped tools because the model couldn't reliably write the
orchestration code between them. so you mirrored the api and hoped the
descriptions were good enough.

what changed is the same thing the stop-doing post points at: the model
can now orchestrate. give it a code sandbox and it will filter, branch,
retry, paginate. you don't need a `list_users_by_org_paginated` tool
when you can give it `query` and let it write the loop.

so the design move becomes: **find the smallest set of primitives the
model needs to express the whole api in code.** two, sometimes. usually
a handful. almost never one-per-endpoint.

## the same instinct, three places

the post lists more patterns than the cloudflare one, but several of
them are the same idea wearing different hats:

**tool search.** instead of loading every tool definition into context,
keep them on disk and let the model search them. claimed savings: 85%
of the tokens that "tools" used to occupy.

**programmatic tool calling.** instead of piping every tool result back
through the context window, run the calls in a sandbox and only return
the final answer to the model. claimed savings: 37% on multi-step
workflows.

**code orchestration over thick tools.** the cloudflare pattern.

three different optimizations, same underlying principle: *the context
window is not the place to put things the model doesn't currently need.*
tool definitions, intermediate results, every leaf of an api tree —
none of them belong in the prompt by default. the model can fetch them
when it asks.

## what i'm taking from this

i've shipped a couple of mcp servers that look more like the
2,500-tool shape than the 2-tool shape. each tool was reasonable. the
descriptions were fine. but the surface was an inventory, not a design.

the question i'm going to start asking, before adding a tool:

- can the model accomplish this by composing tools i already have?
- if not, what's the smallest primitive that closes the gap?
- and — borrowing the stop-doing question — is there a tool i can
  *delete* once this one exists?

the cloudflare number is striking, but it's not really about cloudflare.
it's about what "designing tools" means once the model can write code.
you're not exposing capability anymore. you're choosing where to draw
the line between *give to the model* and *let the model build*.

## the honest part

i don't know how thin is too thin yet. two tools for 2,500 endpoints
sounds great until the model spends half its budget rediscovering the
api shape on every call. there's presumably a regime where mirroring
*is* the right move — small surface, predictable usage, latency
sensitive.

so this isn't "always go thin." it's: stop reaching for the mirrored
shape by default. start from what the model needs to compose, and let
the tool count fall out of that.

> the best tool surface is the smallest one the model can build the
> rest of the api on top of.

still working out where the line falls. but "two" is a more interesting
starting guess than "all of them."
