'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreateMeetingCalendarDialog } from '@/features/calendar/CreateMeetingCalendarDialog';
import { CreateLeadDialog } from '@/features/crm/components/CreateLeadDialog';
import { CreateExpenseDialog } from '@/features/finance/components/expenses/CreateExpenseDialog';
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
  const t = useTranslations('dashboard');
  const { openUnsortedTaskCreate } = useUnsortedTaskCreate();
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState(() => new Date());
  const [leadOpen, setLeadOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

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
      if (key === 'new-lead') {
        setLeadOpen(true);
        return;
      }
      if (key === 'new-expense') {
        setExpenseOpen(true);
      }
    },
    [openUnsortedTaskCreate, t],
  );

  const value = useMemo(() => openCreateAction, [openCreateAction]);

  return (
    <DashboardCreateActionCtx.Provider value={value}>
      {children}
      <DashboardCreateActionDialogs
        expenseOpen={expenseOpen}
        leadOpen={leadOpen}
        meetingDate={meetingDate}
        meetingOpen={meetingOpen}
        onExpenseOpenChange={setExpenseOpen}
        onLeadOpenChange={setLeadOpen}
        onMeetingOpenChange={setMeetingOpen}
      />
    </DashboardCreateActionCtx.Provider>
  );
}

function DashboardCreateActionDialogs({
  expenseOpen,
  leadOpen,
  meetingDate,
  meetingOpen,
  onExpenseOpenChange,
  onLeadOpenChange,
  onMeetingOpenChange,
}: {
  expenseOpen: boolean;
  leadOpen: boolean;
  meetingDate: Date;
  meetingOpen: boolean;
  onExpenseOpenChange: (open: boolean) => void;
  onLeadOpenChange: (open: boolean) => void;
  onMeetingOpenChange: (open: boolean) => void;
}) {
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
      <CreateLeadDialog
        open={leadOpen}
        onOpenChange={onLeadOpenChange}
        onCreated={() => {
          toast.success(t('create.leadCreated'));
        }}
      />
      <CreateExpenseDialog
        open={expenseOpen}
        onOpenChange={onExpenseOpenChange}
        onCreated={() => {
          toast.success(t('create.expenseCreated'));
        }}
      />
    </>
  );
}
