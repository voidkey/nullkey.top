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

export const collections = {
  projects,
  about: singletons,
  now: singletons,
  uses: singletons,
};
