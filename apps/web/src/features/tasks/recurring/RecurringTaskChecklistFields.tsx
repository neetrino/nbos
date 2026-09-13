'use client';

import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RecurringTaskFormDraft } from './recurring-task-form-state';

interface RecurringTaskChecklistFieldsProps {
  draft: RecurringTaskFormDraft;
  disabled: boolean;
  onPatch: (patch: Partial<RecurringTaskFormDraft>) => void;
}

export function RecurringTaskChecklistFields({
  draft,
  disabled,
  onPatch,
}: RecurringTaskChecklistFieldsProps) {
  const t = useTranslations('tasks');
  const updateItem = (index: number, value: string) => {
    onPatch({
      checklistItems: draft.checklistItems.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    });
  };

  return (
    <div className="grid gap-2">
      <Label>{t('recurring.defaultChecklist')}</Label>
      <p className="text-muted-foreground text-xs">{t('recurring.defaultChecklistHint')}</p>
      <div className="grid gap-2">
        {draft.checklistItems.map((item, index) => (
          <div key={`checklist-${index}`} className="flex items-center gap-2">
            <Input
              value={item}
              disabled={disabled}
              placeholder={t('recurring.itemPlaceholder', { n: index + 1 })}
              onChange={(event) => updateItem(index, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={t('recurring.removeItemAria')}
              onClick={() =>
                onPatch({
                  checklistItems: draft.checklistItems.filter(
                    (_, itemIndex) => itemIndex !== index,
                  ),
                })
              }
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={disabled}
          onClick={() => onPatch({ checklistItems: [...draft.checklistItems, ''] })}
        >
          <Plus className="size-4" aria-hidden />
          {t('recurring.addItem')}
        </Button>
      </div>
    </div>
  );
}
