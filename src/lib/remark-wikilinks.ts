import { visit } from 'unist-util-visit';
import type { Root, Text, PhrasingContent } from 'mdast';
import { slugify } from './slugify.ts';
import { getKnownSlugs } from './note-index.ts';

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Transforms Obsidian-style [[wiki links]] (with optional #heading and |alias)
 * into real links to /notes/[slug], matching by filename slug (case-insensitive).
 * Targets that don't match a known note render as <span class="broken-link">.
 */
export function remarkWikilinks() {
  return (tree: Root) => {
    const knownSlugs = getKnownSlugs();

    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('[[')) return;

      const replacement: PhrasingContent[] = [];
      let lastIndex = 0;
      WIKILINK_RE.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = WIKILINK_RE.exec(node.value))) {
        const [full, inner] = match;
        if (match.index > lastIndex) {
          replacement.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        const [targetPart, aliasPart] = inner.split('|');
        const target = targetPart.split('#')[0].trim();
        const displayText = (aliasPart ?? targetPart).trim();
        const slug = slugify(target);

        if (knownSlugs.has(slug)) {
          replacement.push({
            type: 'link',
            url: `/notes/${slug}`,
            children: [{ type: 'text', value: displayText }],
          });
        } else {
          replacement.push({
            type: 'html',
            value: `<span class="broken-link" title="Note not found: ${escapeHtml(target)}">${escapeHtml(displayText)}</span>`,
          } as unknown as PhrasingContent);
        }

        lastIndex = match.index + full.length;
      }

      if (lastIndex < node.value.length) {
        replacement.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...(replacement as any[]));
      return index + replacement.length;
    });
  };
}
