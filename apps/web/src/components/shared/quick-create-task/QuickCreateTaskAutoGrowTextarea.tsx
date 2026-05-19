'use client';

import type { KeyboardEvent, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import {
  QUICK_CREATE_TASK_AUTOCOMPLETE_OFF,
  QUICK_CREATE_TASK_GHOST_INPUT_CLASS,
} from './quick-create-task-constants';
import { useAutoGrowTextarea } from './use-auto-grow-textarea';

const TITLE_MIN_HEIGHT_PX = 44;
const DESCRIPTION_MIN_HEIGHT_PX = 36;

interface QuickCreateTaskAutoGrowTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'rows'
> {
  minHeightPx?: number;
  onSubmitShortcut?: () => void;
}

export function QuickCreateTaskAutoGrowTextarea({
  className,
  value,
  minHeightPx = DESCRIPTION_MIN_HEIGHT_PX,
  onSubmitShortcut,
  onChange,
  onKeyDown,
  ...props
}: QuickCreateTaskAutoGrowTextareaProps) {
  const text = typeof value === 'string' ? value : '';
  const { ref, syncHeight } = useAutoGrowTextarea(text, minHeightPx);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmitShortcut?.();
    }
  };

  return (
    <textarea
      {...props}
      {...QUICK_CREATE_TASK_AUTOCOMPLETE_OFF}
      ref={ref}
      rows={1}
      value={value}
      onChange={(event) => {
        onChange?.(event);
        syncHeight();
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        QUICK_CREATE_TASK_GHOST_INPUT_CLASS,
        'box-border block w-full max-w-full min-w-0 resize-none overflow-hidden [overflow-wrap:anywhere] break-words whitespace-pre-wrap',
        className,
      )}
    />
  );
}

export const QUICK_CREATE_TASK_TITLE_MIN_HEIGHT_PX = TITLE_MIN_HEIGHT_PX;
