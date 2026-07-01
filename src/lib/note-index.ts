import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './slugify.ts';

const COLLECTION_DIRS = [
  'knowledge-base',
  'bug-fixes',
  'interview-notes',
  'system-design',
  'daily-notes',
];

function walk(dir: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push(full);
  }
}

let cachedSlugs: Set<string> | null = null;

/**
 * All valid note slugs across every collection, used to resolve [[wiki links]].
 * Built once per process from the synced `content/` directory on disk, since
 * the remark plugin runs outside of the astro:content pipeline.
 */
export function getKnownSlugs(): Set<string> {
  if (cachedSlugs) return cachedSlugs;
  const files: string[] = [];
  for (const dir of COLLECTION_DIRS) {
    walk(path.join(process.cwd(), 'content', dir), files);
  }
  cachedSlugs = new Set(files.map((f) => slugify(path.basename(f, '.md'))));
  return cachedSlugs;
}
