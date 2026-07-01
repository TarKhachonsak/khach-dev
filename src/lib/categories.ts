export interface CategoryMeta {
  key: CollectionKey;
  label: string;
  labelEn: string;
}

export type CollectionKey =
  | 'knowledge-base'
  | 'bug-fixes'
  | 'interview-notes'
  | 'system-design'
  | 'daily-notes';

export const CATEGORIES: CategoryMeta[] = [
  { key: 'knowledge-base', label: 'ฐานความรู้', labelEn: 'Knowledge Base' },
  { key: 'bug-fixes', label: 'บันทึกบั๊ก', labelEn: 'Bug Fixes' },
  { key: 'interview-notes', label: 'เตรียมสัมภาษณ์', labelEn: 'Interview Notes' },
  { key: 'system-design', label: 'ออกแบบระบบ', labelEn: 'System Design' },
  { key: 'daily-notes', label: 'บันทึกประจำวัน', labelEn: 'Daily Notes' },
];

export function getCategoryMeta(key: CollectionKey): CategoryMeta {
  const meta = CATEGORIES.find((c) => c.key === key);
  if (!meta) throw new Error(`Unknown category: ${key}`);
  return meta;
}
