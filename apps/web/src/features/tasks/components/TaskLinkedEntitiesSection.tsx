'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  RELATION_PICKER_CHIP_STACK_CLASS,
  RELATION_PICKER_EMPTY_TRIGGER_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { getApiErrorMessage } from '@/lib/api-errors';
import { getDriveFileLinkEntityHref } from '@/features/drive/drive-file-link-entity-href';
import { productsApi } from '@/lib/api/products';
import { tasksApi, type Task, type TaskLink } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';
import {
  isTaskEditableLinkType,
  taskLinkEntityIcon,
  taskLinkEntityLabel,
} from '../constants/task-link-entities';
import {
  encodeTaskDeliveryContextValue,
  type TaskDeliveryContextOption,
} from '../utils/search-task-delivery-context';
import { addTaskEntityLink, removeTaskEntityLink } from '../utils/sync-task-entity-links';
import { TaskDeliveryContextSearch } from './TaskDeliveryContextSearch';
import {
  LinkedContextChip,
  LinkedToNotchCaption,
  TASK_LINKED_TO_PLACEHOLDER,
} from './TaskLinkedContextChip';
import {
  TASK_SHEET_CARD_CLASS,
  TASK_SHEET_META_BLOCK_CLASS,
  TASK_SHEET_TEAM_META_GRID_CLASS,
} from './task-sheet-classes';
import { TaskSheetCompactRow } from './task-sheet-compact-row';

interface TaskLinkedEntitiesSectionProps {
  task: Task;
  disabled?: boolean;
  onLinksChange: (links: TaskLink[]) => void;
  /** Full task after Work Space attach/detach (`workspaceId`). */
  onTaskChange: (task: Task) => void;
}

export function TaskLinkedEntitiesSection({
  task,
  disabled = false,
  onLinksChange,
  onTaskChange,
}: TaskLinkedEntitiesSectionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  /** Product id → project name from the last picker selection (sheet session). */
  const [productProjectNames, setProductProjectNames] = useState<Record<string, string>>({});

  const locked = disabled || busy;
  const editableLinks = useMemo(
    () => task.links.filter((link) => isTaskEditableLinkType(link.entityType)),
    [task.links],
  );
  const contextLinks = useMemo(
    () => task.links.filter((link) => !isTaskEditableLinkType(link.entityType)),
    [task.links],
  );
  const linkedValues = useMemo(() => {
    const values = new Set<string>();
    for (const link of editableLinks) {
      if (link.entityType === 'PROJECT' || link.entityType === 'PRODUCT') {
        values.add(encodeTaskDeliveryContextValue(link.entityType, link.entityId));
      }
    }
    if (task.workspaceId) {
      values.add(encodeTaskDeliveryContextValue('WORK_SPACE', task.workspaceId));
    }
    return values;
  }, [editableLinks, task.workspaceId]);

  const hasEditableLinks = Boolean(task.workspaceId) || editableLinks.length > 0;

  const openLink = useCallback(
    async (link: TaskLink) => {
      if (link.entityType === 'PRODUCT') {
        try {
          const product = await productsApi.getById(link.entityId);
          router.push(`/projects/${product.projectId}/products/${product.id}`);
        } catch (caught) {
          toast.error(getApiErrorMessage(caught, 'Product could not be opened.'));
        }
        return;
      }
      const href = getDriveFileLinkEntityHref(link, task.links);
      if (!href) {
        toast.error('No page for this linked entity yet.');
        return;
      }
      router.push(href);
    },
    [router, task.links],
  );

  const setWorkspace = useCallback(
    async (workspaceId: string | null) => {
      setBusy(true);
      try {
        const updated = await tasksApi.update(task.id, { workspaceId });
        onTaskChange(updated);
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not update work space.'));
      } finally {
        setBusy(false);
      }
    },
    [onTaskChange, task.id],
  );

  const handleSelect = useCallback(
    async (option: TaskDeliveryContextOption) => {
      if (option.kind === 'WORK_SPACE') {
        await setWorkspace(option.entityId);
        return;
      }
      setBusy(true);
      try {
        if (option.kind === 'PRODUCT') {
          setProductProjectNames((prev) => ({
            ...prev,
            [option.entityId]: option.contextLabel ?? '',
          }));
        }
        onLinksChange(
          await addTaskEntityLink({
            taskId: task.id,
            links: task.links,
            entityType: option.kind,
            entityId: option.entityId,
            entityLabel: option.label,
          }),
        );
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not link entity.'));
      } finally {
        setBusy(false);
      }
    },
    [onLinksChange, setWorkspace, task.id, task.links],
  );

  const handleUnlink = useCallback(
    async (linkId: string) => {
      setBusy(true);
      try {
        onLinksChange(await removeTaskEntityLink(task.id, task.links, linkId));
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not unlink entity.'));
      } finally {
        setBusy(false);
      }
    },
    [onLinksChange, task.id, task.links],
  );

  const workspaceLabel = task.workspace?.name?.trim() || taskLinkEntityLabel('WORK_SPACE');

  return (
    <section className={TASK_SHEET_CARD_CLASS} aria-label="Linked entities">
      <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
        <LinkedToNotchCaption locked={locked} onAdd={() => setSearchOpen(true)} />

        {searchOpen ? (
          <TaskDeliveryContextSearch
            trigger="none"
            open={searchOpen}
            onOpenChange={setSearchOpen}
            disabled={locked}
            linkedValues={linkedValues}
            onSelect={(option) => void handleSelect(option)}
          />
        ) : hasEditableLinks ? (
          <ul className={RELATION_PICKER_CHIP_STACK_CLASS}>
            {task.workspaceId && workspaceLabel ? (
              <LinkedContextChip
                kind="WORK_SPACE"
                label={workspaceLabel}
                contextLabel={
                  task.workspace?.product?.name?.trim() ||
                  task.workspace?.extension?.product?.name?.trim() ||
                  null
                }
                locked={locked}
                onOpen={() => router.push(`/work-spaces/${task.workspaceId}`)}
                onUnlink={() => void setWorkspace(null)}
              />
            ) : null}

            {editableLinks.map((link) => (
              <LinkedContextChip
                key={link.id}
                kind={link.entityType === 'PRODUCT' ? 'PRODUCT' : 'PROJECT'}
                label={link.entityLabel?.trim() || taskLinkEntityLabel(link.entityType)}
                contextLabel={
                  link.entityType === 'PRODUCT' ? productProjectNames[link.entityId] || null : null
                }
                locked={locked}
                onOpen={() => void openLink(link)}
                onUnlink={() => void handleUnlink(link.id)}
              />
            ))}
          </ul>
        ) : (
          <div
            className={cn(RELATION_PICKER_EMPTY_TRIGGER_CLASS, 'pointer-events-none italic')}
            aria-hidden
          >
            {TASK_LINKED_TO_PLACEHOLDER}
          </div>
        )}
      </div>

      {contextLinks.length > 0 ? (
        <div className={cn(TASK_SHEET_META_BLOCK_CLASS, TASK_SHEET_TEAM_META_GRID_CLASS, 'mt-3')}>
          {contextLinks.map((link) => {
            const LinkIcon = taskLinkEntityIcon(link.entityType);
            return (
              <TaskSheetCompactRow key={link.id} label={taskLinkEntityLabel(link.entityType)}>
                <button
                  type="button"
                  className="hover:bg-muted/70 flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
                  onClick={() => void openLink(link)}
                  title="Open linked entity"
                >
                  <LinkIcon size={13} className="text-muted-foreground shrink-0" aria-hidden />
                  <span className="truncate">
                    {link.entityLabel?.trim() || taskLinkEntityLabel(link.entityType)}
                  </span>
                </button>
              </TaskSheetCompactRow>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
