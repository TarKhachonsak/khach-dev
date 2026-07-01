import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import path from 'node:path';
import { slugify } from './lib/slugify.ts';

const noteSchema = z.object({
  tags: z.array(z.string()).optional().default([]),
  date: z.coerce.date().optional(),
});

function noteCollection(dir: string) {
  return defineCollection({
    loader: glob({
      pattern: '**/*.md',
      base: `./content/${dir}`,
      generateId: ({ entry }) => slugify(path.basename(entry, '.md')),
    }),
    schema: noteSchema,
  });
}

export const collections = {
  'knowledge-base': noteCollection('knowledge-base'),
  'bug-fixes': noteCollection('bug-fixes'),
  'interview-notes': noteCollection('interview-notes'),
  'system-design': noteCollection('system-design'),
  'daily-notes': noteCollection('daily-notes'),
};
