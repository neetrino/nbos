'use client';

import { useState, type FormEvent } from 'react';
import { CreateFormDialog, CreateFormSwitchField } from '@/components/shared';
import {
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { NbosMonthPicker } from '@/components/shared/date-picker';
import { useTranslations } from 'next-intl';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi } from '@/lib/api/payroll-runs';

export interface PayrollRunsCreateRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMonth: string;
  onCreated: () => void | Promise<void>;
}

export function PayrollRunsCreateRunDialog(props: PayrollRunsCreateRunDialogProps) {
  const sessionKey = props.open ? props.defaultMonth : 'closed';
  return <PayrollRunsCreateRunDialogSession key={sessionKey} {...props} />;
}

function PayrollRunsCreateRunDialogSession({
  open,
  onOpenChange,
  defaultMonth,
  onCreated,
}: PayrollRunsCreateRunDialogProps) {
  const t = useTranslations('payroll');
  const tCommon = useTranslations('common');
  const [month, setMonth] = useState(defaultMonth);
  const [seedLines, setSeedLines] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('create.title')}
      error={createError}
      submitting={creating}
      canSubmit={Boolean(month) && !creating}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitPayrollRun({
          event,
          month,
          seedLines,
          setCreating,
          setCreateError,
          onOpenChange,
          onCreated,
          fallbackError: t('create.createError'),
        })
      }
    >
      <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
        <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{t('create.monthLabel')}</span>
        <div className={DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS}>
          <NbosMonthPicker
            id="payroll-month"
            value={month}
            onChange={setMonth}
            aria-label={t('create.monthAria')}
          />
        </div>
      </div>
      <CreateFormSwitchField
        label={t('create.seedLines')}
        checked={seedLines}
        onCheckedChange={setSeedLines}
      />
    </CreateFormDialog>
  );
}

async function submitPayrollRun(options: {
  event: FormEvent;
  month: string;
  seedLines: boolean;
  setCreating: (creating: boolean) => void;
  setCreateError: (error: string | null) => void;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void | Promise<void>;
  fallbackError: string;
}): Promise<void> {
  options.event.preventDefault();
  options.setCreating(true);
  options.setCreateError(null);
  try {
    await payrollRunsApi.create({ payrollMonth: options.month, seedLines: options.seedLines });
    options.onOpenChange(false);
    await options.onCreated();
  } catch (caught) {
    options.setCreateError(getApiErrorMessage(caught, options.fallbackError));
  } finally {
    options.setCreating(false);
  }
}
