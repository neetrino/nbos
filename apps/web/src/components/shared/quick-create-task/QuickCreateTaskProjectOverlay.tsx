'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BOTTOM_SHEET_LAYER_ATTR,
  BOTTOM_SHEET_LAYER_CLOSE_ATTR,
  BOTTOM_SHEET_SWIPE_SCROLL_ATTR,
} from '@/components/layout/bottom-sheet-swipe';
import { TaskDeliveryContextSearch } from '@/features/tasks/components/TaskDeliveryContextSearch';
import type { TaskDeliveryContextOption } from '@/features/tasks/utils/search-task-delivery-context';
import {
  QUICK_CREATE_TASK_PROJECT_LAYER_CLASS,
  QUICK_CREATE_TASK_PROJECT_MOBILE_RESULTS_CLASS,
  QUICK_CREATE_TASK_PROJECT_SEARCH_INPUT_CLASS,
} from './quick-create-task-constants';

interface QuickCreateTaskProjectOverlayProps {
  linkedValues: ReadonlySet<string>;
  disabled: boolean;
  onSelect: (option: TaskDeliveryContextOption) => void;
  onClose: () => void;
}

export function QuickCreateTaskProjectOverlay({
  linkedValues,
  disabled,
  onSelect,
  onClose,
}: QuickCreateTaskProjectOverlayProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');

  return (
    <div
      className={QUICK_CREATE_TASK_PROJECT_LAYER_CLASS}
      role="region"
      aria-label={t('task.project')}
      {...{ [BOTTOM_SHEET_LAYER_ATTR]: '' }}
    >
      <TaskDeliveryContextSearch
        trigger="none"
        open
        fillAvailable
        closeOnOutside={false}
        resultsPlacement="flow"
        resultsFrame="plain"
        showInputClose={false}
        placeholder={t('task.projectSearch')}
        inputClassName={QUICK_CREATE_TASK_PROJECT_SEARCH_INPUT_CLASS}
        resultsListClassName={QUICK_CREATE_TASK_PROJECT_MOBILE_RESULTS_CLASS}
        resultsScrollAttr={BOTTOM_SHEET_SWIPE_SCROLL_ATTR}
        disabled={disabled}
        linkedValues={linkedValues}
        headerAccessory={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/75 size-8 shrink-0 rounded-full"
            aria-label={tCommon('close')}
            disabled={disabled}
            {...{ [BOTTOM_SHEET_LAYER_CLOSE_ATTR]: '' }}
            onClick={onClose}
          >
            <X size={19} strokeWidth={1.75} aria-hidden />
          </Button>
        }
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
        onSelect={onSelect}
      />
    </div>
  );
}
