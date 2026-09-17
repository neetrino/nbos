'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreateMeetingCalendarDialog } from '@/features/calendar/CreateMeetingCalendarDialog';
import { CreateExpenseDialog } from '@/features/finance/components/expenses/CreateExpenseDialog';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { useUnsortedTaskCreate } from '@/features/tasks/components/UnsortedTaskCreateProvider';
import type { DashboardPinnedActionKey } from '../dashboard-control-registry';

type OpenDashboardCreateAction = (key: DashboardPinnedActionKey) => void;

const DashboardCreateActionCtx = createContext<OpenDashboardCreateAction | null>(null);

export function useDashboardCreateAction(): OpenDashboardCreateAction {
  const open = useContext(DashboardCreateActionCtx);
  if (!open) {
    throw new Error('useDashboardCreateAction must be used within DashboardCreateActionsProvider');
  }
  return open;
}

export function DashboardCreateActionsProvider({ children }: { children: ReactNode }) {
  const { openCreateAction, dialogs } = useDashboardCreateDialogState();
  const value = useMemo(() => openCreateAction, [openCreateAction]);

  return (
    <DashboardCreateActionCtx.Provider value={value}>
      {children}
      <DashboardCreateActionDialogs {...dialogs} />
    </DashboardCreateActionCtx.Provider>
  );
}

function useDashboardCreateDialogState() {
  const t = useTranslations('dashboard');
  const { openUnsortedTaskCreate } = useUnsortedTaskCreate();
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState(() => new Date());
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const openCreateAction = useCallback<OpenDashboardCreateAction>(
    (key) => {
      if (key === 'new-task') {
        try {
          openUnsortedTaskCreate();
        } catch {
          toast.error(t('actions.newTaskError'));
        }
        return;
      }
      if (key === 'new-meeting') {
        setMeetingDate(new Date());
        setMeetingOpen(true);
        return;
      }
      if (key === 'new-expense') setExpenseOpen(true);
      else if (key === 'new-invoice') setInvoiceOpen(true);
    },
    [openUnsortedTaskCreate, t],
  );

  return {
    openCreateAction,
    dialogs: {
      expenseOpen,
      invoiceOpen,
      meetingDate,
      meetingOpen,
      onExpenseOpenChange: setExpenseOpen,
      onInvoiceOpenChange: setInvoiceOpen,
      onMeetingOpenChange: setMeetingOpen,
    },
  };
}

interface DashboardCreateActionDialogsProps {
  expenseOpen: boolean;
  invoiceOpen: boolean;
  meetingDate: Date;
  meetingOpen: boolean;
  onExpenseOpenChange: (open: boolean) => void;
  onInvoiceOpenChange: (open: boolean) => void;
  onMeetingOpenChange: (open: boolean) => void;
}

function DashboardCreateActionDialogs({
  expenseOpen,
  invoiceOpen,
  meetingDate,
  meetingOpen,
  onExpenseOpenChange,
  onInvoiceOpenChange,
  onMeetingOpenChange,
}: DashboardCreateActionDialogsProps) {
  const t = useTranslations('dashboard');
  return (
    <>
      <CreateMeetingCalendarDialog
        open={meetingOpen}
        onOpenChange={onMeetingOpenChange}
        selectedDate={meetingDate}
        onCreated={() => {
          toast.success(t('create.meetingCreated'));
        }}
      />
      <CreateExpenseDialog
        open={expenseOpen}
        onOpenChange={onExpenseOpenChange}
        onCreated={() => {
          toast.success(t('create.expenseCreated'));
        }}
      />
      <CreateInvoiceDialog
        open={invoiceOpen}
        onOpenChange={onInvoiceOpenChange}
        onCreated={() => {
          toast.success(t('create.invoiceCreated'));
        }}
      />
    </>
  );
}
