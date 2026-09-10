'use client';

import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import type { Task } from '@/lib/api/tasks';
import { TaskSheetChatPanel, type TaskLocalMessage } from './TaskSheetChatPanel';

const TASK_CHAT_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[90vw] sm:max-w-none sm:data-[side=right]:w-[min(28rem,calc(100vw-2rem))]';

const TASK_CHAT_SHEET_RAIL_ANCHOR_CLASS = `${SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS} sm:right-[min(28rem,calc(100vw-2rem))]`;

interface TaskSheetChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  messages: TaskLocalMessage[];
  onSend: (body: string) => void;
  sourcePageHref: string;
}

/** Mobile nested sheet for task discussion — Back closes to the parent task sheet. */
export function TaskSheetChatSheet({
  open,
  onOpenChange,
  task,
  messages,
  onSend,
  sourcePageHref,
}: TaskSheetChatSheetProps) {
  const { persistedValue: renderTask, onOpenChangeComplete } = useSheetPersistedValue(task);
  const hostMounted = useSheetHostMounted(open, renderTask);

  if (!hostMounted) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="compact"
        contentClassName={TASK_CHAT_SHEET_WIDTH_CLASS}
        railAnchorClassName={TASK_CHAT_SHEET_RAIL_ANCHOR_CLASS}
        showRailActions={false}
        forceNestedBackdrop
        sourcePageHref={sourcePageHref}
      >
        {renderTask ? (
          <TaskSheetChatPanel task={renderTask} messages={messages} onSend={onSend} />
        ) : null}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
