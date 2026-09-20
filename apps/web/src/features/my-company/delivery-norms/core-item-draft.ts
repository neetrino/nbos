import type { CoreItemDto, CoreItemInput } from '@/lib/api/delivery-catalog-structure';
import { CORE_ITEM_INDEX_STEP } from './delivery-norms.constants';

export type CoreItemDraft = {
  key: string;
  label: string;
  note: string;
};

export type CoreItemInputsResult =
  | { error: 'blankLabel' }
  | { error: null; items: CoreItemInput[] };

export function coreItemDraftsFromDto(items: readonly CoreItemDto[]): CoreItemDraft[] {
  return items.map((item) => ({
    key: item.id,
    label: item.label,
    note: item.note ?? '',
  }));
}

export function emptyNoteToNull(note: string): string | null {
  const trimmed = note.trim();
  return trimmed === '' ? null : trimmed;
}

export function addCoreItemDraft(
  drafts: readonly CoreItemDraft[],
  input: { key: string; label: string; note: string },
): CoreItemDraft[] | null {
  const label = input.label.trim();
  if (label === '') {
    return null;
  }
  return [...drafts, { key: input.key, label, note: input.note }];
}

export function replaceCoreItemDraft(
  drafts: readonly CoreItemDraft[],
  key: string,
  patch: Partial<Pick<CoreItemDraft, 'label' | 'note'>>,
): CoreItemDraft[] {
  return drafts.map((row) => (row.key === key ? { ...row, ...patch } : row));
}

export function removeCoreItemDraft(
  drafts: readonly CoreItemDraft[],
  key: string,
): CoreItemDraft[] {
  return drafts.filter((row) => row.key !== key);
}

export function moveCoreItemDraft(
  drafts: readonly CoreItemDraft[],
  key: string,
  direction: 'up' | 'down',
): CoreItemDraft[] {
  const index = drafts.findIndex((row) => row.key === key);
  if (index < 0) {
    return [...drafts];
  }
  const offset = direction === 'up' ? -CORE_ITEM_INDEX_STEP : CORE_ITEM_INDEX_STEP;
  const target = index + offset;
  if (target < 0 || target >= drafts.length) {
    return [...drafts];
  }
  return swapDrafts(drafts, index, target);
}

export function toCoreItemInputs(drafts: readonly CoreItemDraft[]): CoreItemInputsResult {
  const items: CoreItemInput[] = [];
  for (const row of drafts) {
    const label = row.label.trim();
    if (label === '') {
      return { error: 'blankLabel' };
    }
    items.push({ label, note: emptyNoteToNull(row.note) });
  }
  return { error: null, items };
}

function swapDrafts(
  drafts: readonly CoreItemDraft[],
  fromIndex: number,
  toIndex: number,
): CoreItemDraft[] {
  const next = [...drafts];
  const from = next[fromIndex];
  const to = next[toIndex];
  if (from === undefined || to === undefined) {
    return [...drafts];
  }
  next[fromIndex] = to;
  next[toIndex] = from;
  return next;
}
