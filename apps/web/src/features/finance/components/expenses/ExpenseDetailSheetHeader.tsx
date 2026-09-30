'use client';

import { Ban, Receipt, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetSettingsMenu } from '@/components/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useCommitEntityName } from '@/features/finance/hooks/use-commit-entity-name';
import { InlineEditableEntityTitle } from '@/features/projects/components/InlineEditableEntityTitle';
import { expensesApi, type Expense } from '@/lib/api/finance';

interface ExpenseDetailSheetHeaderProps {
  expenseId: string;
  displayName: string;
  canRename: boolean;
  onNameSaved: (expense: Expense) => void;
  lifecycleMode: 'delete' | 'cancel' | null;
  actionsDisabled?: boolean;
  onLifecycleClick: () => void;
}

export function ExpenseDetailSheetHeader({
  expenseId,
  displayName,
  canRename,
  onNameSaved,
  lifecycleMode,
  actionsDisabled = false,
  onLifecycleClick,
}: ExpenseDetailSheetHeaderProps) {
  const t = useTranslations('expenses');
  const commitName = useCommitEntityName({
    enabled: canRename,
    save: (name) => expensesApi.update(expenseId, { name }),
    onSaved: onNameSaved,
    successMessage: t('toasts.updated'),
    errorMessage: t('errors.save'),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
          <Receipt className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <InlineEditableEntityTitle
            value={displayName}
            disabled={!canRename}
            editHint={t('sheet.renameHint')}
            placeholder={t('fields.namePlaceholder')}
            onCommit={commitName}
            titleClassName="text-xl font-bold tracking-tight"
          />
        </div>
      </div>
      {lifecycleMode ? (
        <DetailSheetSettingsMenu>
          <DropdownMenuItem
            variant="destructive"
            disabled={actionsDisabled}
            onClick={onLifecycleClick}
          >
            {lifecycleMode === 'delete' ? <Trash2 /> : <Ban />}
            {lifecycleMode === 'delete' ? t('actions.deleteExpense') : t('actions.cancelExpense')}
          </DropdownMenuItem>
        </DetailSheetSettingsMenu>
      ) : null}
    </div>
  );
}
