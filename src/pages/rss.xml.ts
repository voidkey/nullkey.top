import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'nullkey',
    description: 'Essays and notes by nullkey.',
    site: context.site ?? 'https://nullkey.top',
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.summary,
      link: `/posts/${p.slug}/`,
      categories: p.data.tags,
      author: 'nullkey',
    })),
    customData: '<language>en</language>',
  });
}
