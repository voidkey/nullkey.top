---
title: three shapes of agent work
date: 2026-04-15
summary: notes on anthropic's workflow patterns post — sequential, parallel, evaluator-optimizer, and when to reach for each
tags: [essay, ai, agents]
draft: false
---

*notes on [anthropic's workflow patterns post](https://claude.com/blog/common-workflow-patterns-for-ai-agents-and-when-to-use-them)
and how to pick the right shape for the job.*

most agent code i've seen falls into one of two failure modes: either
everything is a single prompt doing too much, or everything is a
microservice graph doing too little per node. anthropic's post offers a
middle ground — three workflow shapes that cover most of what you'd
actually build in production.

the useful part isn't the taxonomy itself. it's the decision framework
around it.

## the three shapes

**sequential.** A hands off to B, B hands off to C. each step focuses on
one thing. you pay in latency — total time is the sum of all steps —
but each agent gets a clean, narrow job. content pipelines live here:
extract, validate, load. so does draft-review-polish.

**parallel.** fan out to N agents at once, fan in to aggregate. you pay
in tokens — N concurrent calls — but you get wall-clock speed and
separation of concerns. code review is a natural fit: one agent checks
security, another checks performance, a third checks style. they don't
need each other's context.

**evaluator-optimizer.** a generator and a critic in a loop. the generator
drafts, the evaluator scores against criteria, the generator revises.
you pay in tokens × iterations, but the output gets meaningfully better
each round — if and only if you have clear, measurable quality standards
to evaluate against.

## the part people skip

the post's actual advice isn't "use these three patterns." it's
**try a single agent first.**

> start with the simplest pattern that solves your problem.

if one prompt with well-structured instructions handles the task, you're
done. no workflow needed. only reach for sequential when a single agent
can't hold the full task reliably. only reach for parallel when latency
is the bottleneck and the subtasks are genuinely independent. only reach
for evaluator-optimizer when you can *measure* the quality gap between
the first draft and what you need.

this is the same instinct as "what can i stop doing" — don't add
structure until the absence of structure is the actual problem.

## things i want to remember

**aggregation is the hard part of parallelism.** it's easy to fan out.
the post's pro tip is to design your merge strategy *before* you
parallelize. majority vote? weighted confidence? defer to the specialist?
if you don't know how you'll reconcile contradictions, you'll just collect
contradictions.

**evaluator-optimizer needs a kill switch.** without a max iteration count
and a quality threshold, you end up in an expensive loop where the critic
keeps finding nits and the generator keeps tweaking, long after quality
has plateaued. "know when good enough is good enough" is the post's
phrasing. in practice that means: set the number before you start, and
measure whether iteration 3 is actually better than iteration 2.

**these shapes nest.** a sequential pipeline can have a parallel stage.
an evaluator-optimizer loop can use parallel evaluators — one for tone,
one for accuracy, one for compliance. the shapes are building blocks,
not boxes.

## the tension i keep coming back to

there's a pull between two ideas in the recent anthropic posts. one says
*let the model orchestrate itself* — give it bash and get out of the way.
the other says *give it structure* — define the flow, set checkpoints,
draw boundaries.

i don't think these contradict each other. the resolution is scope.
*within* a step, let the agent be autonomous — pick tools, write code,
decide what matters. *across* steps, define the shape — what feeds into
what, when to stop, how to aggregate.

autonomy inside. structure outside. the workflow is the container, not
the brain.

> a good workflow tells the agent where to think, not what to think.

still working out where exactly that line falls in my own code. but
having three named shapes to reach for — instead of inventing topology
from scratch each time — already helps.
