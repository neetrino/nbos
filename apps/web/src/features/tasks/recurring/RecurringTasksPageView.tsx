'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NAVIGABLE_ENTITY_CARD_GRID_CLASS,
  PageHero,
  PageHeroPrimaryAction,
  PageHeroSearch,
  PageHeroTabs,
} from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { usePermission } from '@/lib/permissions';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import type { RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import { RecurringTaskCard } from './RecurringTaskCard';
import { RecurringTaskSheet } from './RecurringTaskSheet';
import { RECURRING_STATUS_TABS } from './recurring-task-constants';
import { useRecurringTasks } from './use-recurring-tasks';

export function RecurringTasksPageView() {
  const { can } = usePermission();
  const { creatorId } = useTaskCreatorId();
  const list = useRecurringTasks();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<RecurringTaskTemplate | null>(null);
  const canAdd = can('ADD', 'TASKS');
  const canEdit = can('EDIT', 'TASKS');
  const canDelete = can('DELETE', 'TASKS');

  const openCreate = () => {
    setSelected(null);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    const row = list.templates.find((item) => item.id === id) ?? null;
    setSelected(row);
    setSheetOpen(true);
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Recurring tasks"
        tabs={
          <PageHeroTabs
            value={list.status}
            onChange={list.setStatus}
            options={[...RECURRING_STATUS_TABS]}
            ariaLabel="Recurring status"
          />
        }
        search={
          <PageHeroSearch
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search templates…"
          />
        }
        trailing={
          <>
            <Link href="/tasks" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Back to Tasks
            </Link>
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={list.processingDue}
                onClick={() => void list.processDue()}
              >
                {list.processingDue ? 'Creating…' : 'Create due tasks'}
              </Button>
            ) : null}
            {canAdd ? (
              <PageHeroPrimaryAction
                label="New recurring task"
                disabled={!creatorId}
                onClick={openCreate}
              />
            ) : null}
          </>
        }
      />

      {list.loading ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState description={list.error} onRetry={list.fetchTemplates} />
      ) : list.visible.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={list.templates.length === 0 ? 'No recurring tasks' : 'No matches'}
          description={
            list.templates.length === 0
              ? 'Create a schedule. The template is not a task — it creates ordinary tasks when due.'
              : 'Try another search or status filter.'
          }
          action={
            canAdd && list.templates.length === 0 ? (
              <Button disabled={!creatorId} onClick={openCreate}>
                <Plus size={16} aria-hidden />
                New template
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className={NAVIGABLE_ENTITY_CARD_GRID_CLASS}>
          {list.visible.map((row) => (
            <li key={row.id}>
              <RecurringTaskCard template={row} onOpen={openEdit} />
            </li>
          ))}
        </ul>
      )}

      <RecurringTaskSheet
        open={sheetOpen}
        template={selected}
        creatorId={creatorId}
        canEdit={selected ? canEdit : canAdd}
        canDelete={canDelete}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
        onSaved={list.upsert}
        onDeleted={list.remove}
      />
    </div>
  );
}
