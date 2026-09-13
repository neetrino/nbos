import { tasksApi } from '@/lib/api/tasks';
import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';
import { uploadDriveFilesToEntity } from '@/features/drive/drive-entity-upload';
import type { QuickCreateDraftChecklist } from './quick-create-task-extras';

const TASK_ATTACHMENT_PURPOSE = 'TASK_ATTACHMENT';

function resolveTasksDriveLibrary() {
  const library = DRIVE_LIBRARIES.find((item) => item.key === 'tasks');
  if (!library) {
    throw new Error('Drive library configuration missing required "tasks" entry.');
  }
  return library;
}

export function hasPersistableChecklist(list: QuickCreateDraftChecklist): boolean {
  return list.items.some((item) => item.text.trim());
}

export async function persistQuickCreateChecklists(
  taskId: string,
  checklists: readonly QuickCreateDraftChecklist[],
): Promise<void> {
  for (const list of checklists) {
    if (!hasPersistableChecklist(list)) continue;
    const created = await tasksApi.createChecklist(taskId, list.title.trim() || undefined);
    for (const item of list.items) {
      const text = item.text.trim();
      if (!text) continue;
      const saved = await tasksApi.addChecklistItem(created.id, text);
      if (item.checked) await tasksApi.toggleChecklistItem(saved.id);
    }
  }
}

export async function persistQuickCreateFiles(
  taskId: string,
  files: readonly File[],
): Promise<void> {
  if (files.length === 0) return;
  await uploadDriveFilesToEntity(
    files,
    { entityType: 'TASK', entityId: taskId },
    resolveTasksDriveLibrary(),
    { purpose: TASK_ATTACHMENT_PURPOSE },
  );
}

export async function persistQuickCreateTaskExtras(
  taskId: string,
  extras: {
    checklists: readonly QuickCreateDraftChecklist[];
    files: readonly File[];
  },
): Promise<void> {
  await persistQuickCreateChecklists(taskId, extras.checklists);
  await persistQuickCreateFiles(taskId, extras.files);
}
