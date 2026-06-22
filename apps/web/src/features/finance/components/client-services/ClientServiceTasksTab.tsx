'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, ExternalLink, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityItemList,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { clientServiceTaskLinkToItemSummary } from '@/features/finance/entity-item/client-service-finance-item-summary';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';

interface ClientServiceTasksTabProps {
  links: ClientServiceFinanceLinks | undefined;
  canCreateTask: boolean;
  onCreateTask: () => void;
}

function taskHref(task: ClientServiceFinanceLinks['tasks'][number]): string {
  if (task.workspaceId) {
    return `/work-spaces/${task.workspaceId}`;
  }
  return '/tasks';
}

export function ClientServiceTasksTab({
  links,
  canCreateTask,
  onCreateTask,
}: ClientServiceTasksTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const tasks = useMemo(() => links?.tasks ?? [], [links?.tasks]);
  const firstTask = tasks[0];

  const itemSummaries = useMemo(
    () => tasks.map((row) => clientServiceTaskLinkToItemSummary(row)),
    [tasks],
  );

  return (
    <DetailSheetSection title="Tasks" icon={<CheckSquare size={12} />}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" size="sm" disabled={!canCreateTask} onClick={onCreateTask}>
          <Plus size={14} aria-hidden />
          Create task
        </Button>
        <ViewModeSwitch
          value={viewVariant}
          onChange={setViewVariant}
          options={ENTITY_ITEM_VIEW_OPTIONS}
          ariaLabel="Task list view"
        />
      </div>

      <EntityItemList
        items={itemSummaries}
        variant={viewVariant}
        onOpen={onOpenItem}
        emptyIcon={CheckSquare}
        emptyTitle="No tasks"
        emptyDescription="No tasks linked to this service yet."
      />

      {firstTask ? (
        <Link
          href={taskHref(firstTask)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
        >
          <CheckSquare size={14} aria-hidden />
          Open workspace
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      ) : null}
    </DetailSheetSection>
  );
}
