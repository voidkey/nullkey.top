---
title: where the work moves
date: 2026-05-14
summary: notes on four names for agent engineering — prompt, context, harness, self-evolving — and what the renaming is actually tracking
tags: [essay, ai, agents]
draft: false
---

*a synthesis post — pulling on threads from earlier ones
(stop-doing, three-shapes, tools-are-not-apis,
prefix-is-load-bearing) and the half-dozen anthropic and
openai posts they pointed at.*

in the last two years, the phrase that names "the work"
in building agents has changed four times. prompt
engineering. context engineering. harness engineering.
self-evolving agents.

each one landed with a small dopamine hit of *ah, now i
finally see the real problem*. each one, six months
later, turned out to describe the layer just above the
one i was actually working on. let me lay out what each
was pointing at, and what the renaming is showing.

## prompt engineering — the words

the early frame: the model is a function from text to
text. the work is finding the right text. anthropic's
[building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
post is the catalog version of this era — five
composable shapes (chain, route, parallelize,
orchestrate, evaluate-optimize), each built from prompts
glued together with code paths *you* defined.

what made the era make sense: the model couldn't
reliably loop, couldn't pick its own tools, couldn't
recover from its own mistakes. so you scripted around
it. workflows were "predefined code paths." the model
filled in the cells.

even the evaluator-optimizer loop — generate, separate
call to grade, revision pass — got compressed the
moment the model could self-critique inside a single
response. the pattern wasn't wrong; the gap it filled
had closed.

the unit of work was the prompt. you wrote one. you
wrote a chain of them. you tuned the words.
(three-shapes is squarely a post from this era.)

## context engineering — the window

at some point — roughly when 200k-token windows
started appearing — the bottleneck moved. the model
could now loop, could now decide. but it could only see
what fit in the window. and what fit was getting noisy.

anthropic's [context engineering cookbook](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)
states the constraint plainly: *context is finite with
diminishing returns*. *context rot* — recall degrades
as the window fills, before the hard limit.

the cookbook's research-agent run is the cleanest demo
of the shift. same model, same task, no change to any
prompt. just adding clearing and compaction took peak
context from 335k tokens to 170k. nothing about what to
*say* changed; only what got to *stay* did.

three primitives showed up: **compaction** summarizes
prior turns when the window crosses a threshold;
**clearing** drops old tool results while keeping the
call records, so the agent can re-fetch; **memory** lets
the model write files it'll re-read next session.

[skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
sat next to these. a yaml header on disk; the body
loads only when the model judges the skill relevant. an
entire skill costs roughly a sentence to *be available*;
loading its body is an action the model decides to take.
addressable context went from "what fits" to "what i
can reach."

the unit of work was no longer the prompt. it was *what
enters the window, and when.*

## harness engineering — the room

then the loop got long. agents weren't single calls
anymore; they were processes that lived for hours,
sometimes days. and the things that mattered weren't
visible in any single call.

anthropic's [harness design post](https://www.anthropic.com/engineering/harness-design-long-running-apps)
puts it bluntly: *"every component in a harness encodes
an assumption about what the model can't do on its
own."* [openai](https://openai.com/index/harness-engineering/)
arrives at the same place from a different door:
*"humans steer. agents execute."*

the harness is the room around the call. cache shape,
compaction triggers, planner/generator/evaluator
decompositions, the sandbox the model runs code in, the
way errors come back, what survives a context reset.

the harness post is honest about how brittle each of
these assumptions is. their three-agent decomposition —
planner, generator, evaluator — survived the jump to
opus 4.6. the sprint-chunking they'd built next to it,
to compensate for short-horizon planning, didn't. same
paper, same team, two components, opposite fates. one
was load-bearing. the other had quietly become
overhead.

cache stops being an optimization and becomes the
contract (prefix-is-load-bearing). tools stop being an
inventory and become affordances chosen for *this*
caller (tools-are-not-apis). the question is no longer
"what should this call do" but "what should the loop
around this call look like."

## self-evolving agents — the room edits itself

the most recent frame: the agent edits its own harness.
openai's [self-evolving agents cookbook](https://developers.openai.com/cookbook/examples/partners/self_evolving_agents/autonomous_agent_retraining)
is the clearest example i've seen — and the url is
misleading. nothing here touches model weights. what
evolves is the prompt and the configuration around it.

there's a metaprompt agent that rewrites prompts. a
`VersionedPrompt` class that tracks every iteration
with rollback metadata. graders that score outputs
against multiple criteria — domain fidelity, length
drift, semantic similarity, llm-judge. when the score
crosses a threshold, the agent swaps the new prompt in.
no human in the loop.

the loop closes. the thing you used to *write* — the
prompt, the context strategy, the harness configuration
— becomes a variable the system updates. the unit of
work is no longer in any single artifact. it's the
grader.

## the pattern

four names. one direction. each frame becomes legible
the moment the model absorbs the previous one. you
stop *engineering the prompt* the day the model can
rewrite a bad prompt itself. you stop *engineering the
context* the day skills load themselves on demand. you
stop *engineering the harness* the day the harness can
edit itself.

the locus of leverage moves outward. first the words.
then the window. then the loop. then the system that
edits the loop. each layer was once the whole job.
each layer turned into dead weight the moment the
layer below it grew into the gap.

> every name for "the work" is also a forecast of what
> you'll eventually delete.

## the script i keep meaning to delete

there's at least one wrapper in every project i have
that's wearing out. a tool-loop detector that hasn't
fired in weeks. a json-formatting fallback that hasn't
caught a malformed response in months. a "let me think
step by step" prefill that used to add points on
benchmarks and now mostly adds noise. each one solved a
real problem the day i wrote it. none of them are
broken. the floor moved.

the wrappers i can name are the lucky ones — i know to
be skeptical of them. the dangerous ones are the
abstractions i still think i need.

the durable instinct, the one that survives the next
rename: when the model improves, the layer you just
spent six months building is the layer you have to be
willing to delete.

## where the work goes next

the openai cookbook already shows where the work moves
when the loop closes. the agent rewrites its own
prompts. it runs its own grading. the one thing it
can't yet do is *decide what the grader checks for.*
those choices are still a human's, and the entire
automated loop chases wherever they point.

so the next center of gravity isn't really hiding. it's
right there in the diagram, doing the one job the loop
doesn't subsume: specifying what counts as good.

if the pattern holds — and there's no reason to think
it breaks here — that layer gets absorbed too. some
year the model will read a project and infer the
graders, and the engineering will move again, to
whatever sits one floor above *that*.

> the names are scaffolding. they help right up to the
> point where they become the thing in the way.
