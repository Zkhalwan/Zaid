import { diffWordsWithSpace, Change } from 'diff';

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function computeWordDiff(oldText: string, newText: string): DiffPart[] {
  if (!oldText && !newText) return [];
  if (!oldText) return [{ value: newText, added: true }];
  if (!newText) return [{ value: oldText, removed: true }];

  const changes: Change[] = diffWordsWithSpace(oldText, newText);
  return changes.map((part) => ({
    value: part.value,
    added: part.added,
    removed: part.removed,
  }));
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 200);
  return `${minutes} min read`;
}
