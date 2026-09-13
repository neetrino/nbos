import { nextDefaultChecklistTitle } from '@/features/tasks/components/task-checklist-helpers';
import { newQuickCreateDraftId, type QuickCreateDraftChecklist } from './quick-create-task-extras';

export function createQuickCreateChecklist(
  existing: readonly Pick<QuickCreateDraftChecklist, 'title'>[],
): QuickCreateDraftChecklist {
  return {
    localId: newQuickCreateDraftId(),
    title: nextDefaultChecklistTitle(existing.map((list) => list.title)),
    items: [],
  };
}

export function addQuickCreateChecklistItem(
  lists: QuickCreateDraftChecklist[],
  checklistId: string,
  text: string,
): QuickCreateDraftChecklist[] {
  const trimmed = text.trim();
  if (!trimmed) return lists;
  return lists.map((list) =>
    list.localId === checklistId
      ? {
          ...list,
          items: [
            ...list.items,
            { localId: newQuickCreateDraftId(), text: trimmed, checked: false },
          ],
        }
      : list,
  );
}

export function toggleQuickCreateChecklistItem(
  lists: QuickCreateDraftChecklist[],
  checklistId: string,
  itemId: string,
): QuickCreateDraftChecklist[] {
  return lists.map((list) =>
    list.localId !== checklistId
      ? list
      : {
          ...list,
          items: list.items.map((item) =>
            item.localId === itemId ? { ...item, checked: !item.checked } : item,
          ),
        },
  );
}

export function removeQuickCreateChecklistItem(
  lists: QuickCreateDraftChecklist[],
  checklistId: string,
  itemId: string,
): QuickCreateDraftChecklist[] {
  return lists.map((list) =>
    list.localId !== checklistId
      ? list
      : { ...list, items: list.items.filter((item) => item.localId !== itemId) },
  );
}

export function renameQuickCreateChecklist(
  lists: QuickCreateDraftChecklist[],
  checklistId: string,
  title: string,
): QuickCreateDraftChecklist[] {
  return lists.map((list) => (list.localId === checklistId ? { ...list, title } : list));
}

export function renameQuickCreateChecklistItem(
  lists: QuickCreateDraftChecklist[],
  checklistId: string,
  itemId: string,
  text: string,
): QuickCreateDraftChecklist[] {
  return lists.map((list) =>
    list.localId !== checklistId
      ? list
      : {
          ...list,
          items: list.items.map((item) => (item.localId === itemId ? { ...item, text } : item)),
        },
  );
}
