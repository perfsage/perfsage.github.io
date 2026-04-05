import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** Optional hero image (relative to public/ or an absolute URL) */
    heroImage: z.string().optional(),
    /** Short author name override; defaults to "Aashish Bajpai" */
    author: z.string().default('Aashish Bajpai'),
  }),
});

export const collections = { blog };
