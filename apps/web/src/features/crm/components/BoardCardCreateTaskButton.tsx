'use client';

import type { MouseEvent } from 'react';
import { CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Same glyph as Tasks module pages and task entity summaries. */
export const BOARD_CARD_CREATE_TASK_ICON = CheckSquare;

export const BOARD_CARD_CREATE_TASK_ARIA_LABEL = 'Create task';
export const BOARD_CARD_CREATE_TASK_LABEL = 'Task';
const BOARD_CARD_CREATE_TASK_ICON_SIZE = 14;

/** Reserved footer slot — bottom-right, does not overlay avatar/date. */
export const BOARD_CARD_CREATE_TASK_SLOT_CLASS = 'ml-auto shrink-0 self-end';

export function getBoardCardCreateTaskSlotClassName(): string {
  return BOARD_CARD_CREATE_TASK_SLOT_CLASS;
}

export function stopBoardCardCreateTaskClick(
  event: Pick<MouseEvent, 'stopPropagation'>,
  onCreateTask: () => void,
): void {
  event.stopPropagation();
  onCreateTask();
}

interface BoardCardCreateTaskButtonProps {
  onCreateTask: () => void;
  className?: string;
  showLabel?: boolean;
}

export function BoardCardCreateTaskButton({
  onCreateTask,
  className,
  showLabel = false,
}: BoardCardCreateTaskButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'sm' : 'icon-xs'}
      className={cn(
        getBoardCardCreateTaskSlotClassName(),
        'opacity-0 group-hover:opacity-100',
        className,
      )}
      aria-label={BOARD_CARD_CREATE_TASK_ARIA_LABEL}
      onClick={(event) => stopBoardCardCreateTaskClick(event, onCreateTask)}
    >
      <BOARD_CARD_CREATE_TASK_ICON size={BOARD_CARD_CREATE_TASK_ICON_SIZE} />
      {showLabel ? BOARD_CARD_CREATE_TASK_LABEL : null}
    </Button>
  );
}
