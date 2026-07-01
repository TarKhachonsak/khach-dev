// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { remarkWikilinks } from './src/lib/remark-wikilinks.ts';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  markdown: {
    processor: unified({ remarkPlugins: [remarkWikilinks] }),
    shikiConfig: {
      theme: 'tokyo-night',
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});