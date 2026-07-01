# kh.dev — Knowledge Base

A static Astro site that turns an Obsidian vault into a browsable knowledge base: Knowledge Base notes, Bug Fixes, Interview Notes (with flashcards), System Design, and Daily Notes. `[[wiki links]]` are converted into real links between notes at build time.

## Stack

- Astro (static output) + TypeScript (strict)
- Tailwind CSS v4 + `@tailwindcss/typography`
- Shiki syntax highlighting (`tokyo-night` theme)
- Content Layer API (`astro:content`) reading from `content/` at the project root

## Project structure

```
content/              synced copy of the Obsidian vault (tracked in git, source of truth for the build)
  knowledge-base/
  bug-fixes/
  interview-notes/
  system-design/
  daily-notes/
src/
  content/config.ts   collection definitions (glob loader + schema)
  lib/                slugify, wiki-link resolution, note helpers, flashcard parser
  components/         Sidebar, NoteCard, TagBadge, FlashCard, TableOfContents
  layouts/            BaseLayout (sidebar + responsive shell)
  pages/              routes: /, /[category], /notes/[slug], /tags/[tag], /interview
scripts/
  sync-vault.ps1      copies *.md from the Obsidian vault into content/
  watch-vault.ps1      watches the vault and auto-deploys on changes
deploy.ps1            sync -> commit -> push (Vercel auto-builds on push)
```

## Setup

1. Install dependencies (requires Node 18.20+/20.3+/22+):

   ```powershell
   npm install
   ```

2. Point the scripts at your Obsidian vault. Set it once per shell session, or add it to your PowerShell profile to persist it:

   ```powershell
   $env:OBSIDIAN_VAULT_PATH = "C:\Users\khach\Obsidian Vault\Programming"
   ```

3. Pull the vault content into `content/`:

   ```powershell
   npm run sync
   ```

## Development

```powershell
npm run dev
```

Runs the dev server at `http://localhost:4321`. Re-run `npm run sync` after editing notes in Obsidian to see the changes locally (or use `npm run watch`, see below).

## Build

```powershell
npm run build
npm run preview   # preview the production build locally
```

## Deploying (Obsidian -> Vercel)

This repo is meant to be connected to Vercel with auto-deploy on push to `main`.

- **Vercel project settings:** Build Command `npm run build`, Output Directory `dist`, framework preset Astro (see `vercel.json`).
- **One-shot deploy:** after editing notes in Obsidian, run:

  ```powershell
  .\deploy.ps1
  ```

  This syncs `content/` from the vault, commits only if something changed, and pushes to `main`. Vercel picks up the push and rebuilds automatically.

- **Fully automatic (file watcher):** run this in a background terminal while you work in Obsidian:

  ```powershell
  npm run watch
  ```

  It watches the vault folders and calls `deploy.ps1` ~10 seconds after the last file change (debounced so multi-file saves batch into one deploy). Keep the terminal open, or register it in Task Scheduler (Program: `powershell`, Arguments: `-ExecutionPolicy Bypass -File <project>\scripts\watch-vault.ps1`, Trigger: at logon) to run it automatically.

## Notes on content

- Collections are read from `content/<category>/**/*.md`, not `src/content/`, so the vault sync target and the Astro content source are the same directory.
- A note's slug is derived from its filename (`slugify(basename)`), matching how `[[wiki links]]` are resolved — so `[[Angular Input Object Reference]]` resolves to `/notes/angular-input-object-reference` regardless of which category the target lives in. Unresolved links render as `<span class="broken-link">`.
- Tags come from frontmatter (`tags: [a, b]`); notes without frontmatter simply have no tags.
- Daily Notes without a frontmatter `date` fall back to the date encoded in their filename (`YYYY-MM-DD.md`).
