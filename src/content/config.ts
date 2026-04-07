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

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  projects,
  about: singletons,
  now: singletons,
  uses: singletons,
  posts,
};
