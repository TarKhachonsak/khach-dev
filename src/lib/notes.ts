import { getCollection, type CollectionEntry } from 'astro:content';
import path from 'node:path';
import { CATEGORIES, type CollectionKey } from './categories.ts';

export type AnyNoteEntry = CollectionEntry<CollectionKey>;

export interface NoteWithMeta {
  collection: CollectionKey;
  slug: string;
  title: string;
  tags: string[];
  date?: Date;
  entry: AnyNoteEntry;
}

/** The original filename (with spacing/casing intact) is the note title. */
export function getNoteTitle(entry: AnyNoteEntry): string {
  if (entry.filePath) return path.basename(entry.filePath, '.md');
  return entry.id;
}

const DAILY_NOTE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Falls back to the filename date for Daily Notes that have no frontmatter date. */
export function getEffectiveDate(entry: AnyNoteEntry, collection: CollectionKey): Date | undefined {
  if (entry.data.date) return entry.data.date;
  if (collection === 'daily-notes') {
    const title = getNoteTitle(entry);
    if (DAILY_NOTE_DATE_RE.test(title)) return new Date(`${title}T00:00:00`);
  }
  return undefined;
}

function toNoteWithMeta(entry: AnyNoteEntry, collection: CollectionKey): NoteWithMeta {
  return {
    collection,
    slug: entry.id,
    title: getNoteTitle(entry),
    tags: entry.data.tags ?? [],
    date: getEffectiveDate(entry, collection),
    entry,
  };
}

export async function getNotesByCollection(collection: CollectionKey): Promise<NoteWithMeta[]> {
  const entries = await getCollection(collection);
  return entries.map((entry) => toNoteWithMeta(entry, collection));
}

export async function getAllNotes(): Promise<NoteWithMeta[]> {
  const results = await Promise.all(CATEGORIES.map(({ key }) => getNotesByCollection(key)));
  return results.flat();
}

export function sortByDateDesc(notes: NoteWithMeta[]): NoteWithMeta[] {
  return [...notes].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

export function sortByTitle(notes: NoteWithMeta[]): NoteWithMeta[] {
  return [...notes].sort((a, b) => a.title.localeCompare(b.title));
}
