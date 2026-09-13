'use client';

import type { ReactNode, RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Flame, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  QUICK_CREATE_TASK_FOOTER_CLASS,
  QUICK_CREATE_TASK_HEADER_ICONS_CLASS,
  QUICK_CREATE_TASK_TITLE_INPUT_CLASS,
  QUICK_CREATE_TASK_TITLE_ROW_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_CLASS,
  TASK_PRIORITY_FLAME_ICON_SIZE,
} from './quick-create-task-constants';
import {
  QuickCreateTaskAutoGrowTextarea,
  QUICK_CREATE_TASK_TITLE_MIN_HEIGHT_PX,
} from './QuickCreateTaskAutoGrowTextarea';

export function QuickCreateTaskTitleRow({
  title,
  isHighPriority,
  disabled,
  saving,
  titleInputRef,
  onTitleChange,
  onAdvance,
  onTogglePriority,
  onSubmit,
  onClose,
}: {
  title: string;
  isHighPriority: boolean;
  disabled: boolean;
  saving: boolean;
  titleInputRef: RefObject<HTMLTextAreaElement | null>;
  onTitleChange: (value: string) => void;
  onAdvance: () => void;
  onTogglePriority: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  return (
    <div className={QUICK_CREATE_TASK_TITLE_ROW_CLASS}>
      <QuickCreateTaskAutoGrowTextarea
        id="quick-task-title"
        name="quick-create-task-title"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder={t('task.namePlaceholder')}
        autoFocus
        inputMode="text"
        enterKeyHint="next"
        enterMode="title"
        inputRef={titleInputRef}
        disabled={disabled}
        minHeightPx={QUICK_CREATE_TASK_TITLE_MIN_HEIGHT_PX}
        className={cn(QUICK_CREATE_TASK_TITLE_INPUT_CLASS, 'min-w-0 flex-1')}
        onAdvance={onAdvance}
        onSubmitShortcut={onSubmit}
      />
      <div className={QUICK_CREATE_TASK_HEADER_ICONS_CLASS}>
        <button
          type="button"
          className={cn(
            TASK_PRIORITY_FLAME_BUTTON_CLASS,
            'hover:text-orange-600',
            isHighPriority && TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
          )}
          aria-pressed={isHighPriority}
          aria-label={isHighPriority ? t('task.urgent') : t('task.markAsUrgent')}
          title={isHighPriority ? t('task.urgent') : t('task.markAsUrgent')}
          disabled={saving}
          onClick={onTogglePriority}
        >
          <Flame size={TASK_PRIORITY_FLAME_ICON_SIZE} strokeWidth={1.75} aria-hidden />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground/75 size-8 rounded-full"
          aria-label={tCommon('close')}
          disabled={saving}
          onClick={onClose}
        >
          <X size={19} strokeWidth={1.75} aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function QuickCreateTaskFooter({
  actions,
  onOpenFull,
  saving,
  canCreate,
  onCreate,
  onCancel,
}: {
  actions?: ReactNode;
  onOpenFull?: () => void;
  saving: boolean;
  canCreate: boolean;
  onCreate: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  return (
    <div className={QUICK_CREATE_TASK_FOOTER_CLASS}>
      {actions}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-lg px-5"
          onClick={onCreate}
          disabled={saving || !canCreate}
        >
          {saving ? tCommon('creating') : tCommon('create')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-foreground h-9 px-2"
          onClick={onCancel}
          disabled={saving}
        >
          {tCommon('cancel')}
        </Button>
        {onOpenFull ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-muted-foreground h-9 px-0 text-sm font-normal"
            onClick={onOpenFull}
          >
            {t('task.fullForm')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
