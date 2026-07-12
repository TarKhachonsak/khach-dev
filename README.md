# khach-dev — Knowledge Base

A static Astro site that turns an Obsidian vault into a browsable knowledge base: Knowledge Base notes, Bug Fixes, Interview Notes (with flashcards), System Design, and Daily Notes. `[[wiki links]]` are converted into real links between notes at build time.

> **คู่มือการใช้งานและ troubleshooting:** [`docs/manual.md`](docs/manual.md)

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
  watch-vault.ps1     polls the vault every 5s and auto-deploys on changes (debounced 15s)
deploy.ps1            git add content/ -> commit -> push (Vercel auto-builds on push)
docs/
  manual.md           คู่มือการใช้งาน, คำสั่ง, และ troubleshooting
```

## Setup

1. Install dependencies (requires Node 18.20+/20.3+/22+):

   ```powershell
   npm install
   ```

2. Point the scripts at your Obsidian vault — set once per shell session, or add to your PowerShell profile:

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

Runs the dev server at `http://localhost:4321`. Re-run `npm run sync` after editing notes in Obsidian to see changes locally.

## Build

```powershell
npm run build
npm run preview   # preview the production build locally
```

## Deploying (Obsidian → Vercel)

This repo is connected to Vercel with auto-deploy on push to `main`.

**Vercel project settings:** Build Command `npm run build`, Output Directory `dist`, framework preset Astro (see `vercel.json`).

### One-shot deploy

After editing notes in Obsidian, run:

```powershell
.\deploy.ps1
```

Syncs `content/` from the vault, commits only if something changed, and pushes to `main`. Vercel picks up the push and rebuilds automatically (~1-2 minutes).

### Fully automatic (file watcher)

The watcher uses **polling** (every 5s) instead of `FileSystemWatcher` events — required because Obsidian writes files atomically (temp file → rename), which .NET `FileSystemWatcher` does not reliably detect on Windows.

Register once in Task Scheduler to run automatically at logon (Run as Administrator):

```powershell
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"C:\Users\khach\Development\Personal Project\khach-dev\scripts\watch-vault.ps1`" -VaultPath `"C:\Users\khach\Obsidian Vault\Programming`"" `
  -WorkingDirectory "C:\Users\khach\Development\Personal Project\khach-dev"
$trigger = New-ScheduledTaskTrigger -AtLogon -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit 0 `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask `
  -TaskName "ObsidianVaultWatcher" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
```

Or run manually in a background terminal:

```powershell
npm run watch
```

After the watcher is running, the only manual step each day is running `/programming-journal` in Claude Code.

### Daily workflow

1. Work normally in VS Code + Claude Code
2. At end of day, run in Claude Code:
   ```
   /programming-journal
   ```
3. Answer the date prompt → Claude writes notes to Obsidian → watcher detects changes → deploys automatically

## Notes on content

- Collections are read from `content/<category>/**/*.md`, not `src/content/`, so the vault sync target and the Astro content source are the same directory.
- A note's slug is derived from its filename (`slugify(basename)`), matching how `[[wiki links]]` are resolved — so `[[Angular Input Object Reference]]` resolves to `/notes/angular-input-object-reference` regardless of which category the target lives in. Unresolved links render as `<span class="broken-link">`.
- Tags come from frontmatter (`tags: [a, b]`); notes without frontmatter simply have no tags.
- Daily Notes without a frontmatter `date` fall back to the date encoded in their filename (`YYYY-MM-DD.md`).
