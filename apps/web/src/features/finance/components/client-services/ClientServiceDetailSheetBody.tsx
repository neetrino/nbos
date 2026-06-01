'use client';

import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import type { Project } from '@/lib/api/projects';
import { ClientServiceGeneralTab } from './ClientServiceGeneralTab';
import { ClientServiceInvoicesTab } from './ClientServiceInvoicesTab';
import { ClientServiceExpensesTab } from './ClientServiceExpensesTab';
import { ClientServiceTasksTab } from './ClientServiceTasksTab';
import type { ClientServiceActionKind } from './ClientServiceSheetActions';
import type { ClientServiceDetailSheetTab } from './client-service-detail-sheet-tabs';

interface ClientServiceDetailSheetBodyProps {
  activeTab: ClientServiceDetailSheetTab;
  serviceId: string;
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  projects: Project[];
  saving: boolean;
  actionId: string | null;
  canCreateTask: boolean;
  onAction: (kind: ClientServiceActionKind) => void;
}

export function ClientServiceDetailSheetBody({
  activeTab,
  serviceId,
  service,
  draft,
  patchDraft,
  projects,
  saving,
  actionId,
  canCreateTask,
  onAction,
}: ClientServiceDetailSheetBodyProps) {
  const isActionBusy = (kind: ClientServiceActionKind) => actionId === `${kind}:${service.id}`;

  if (activeTab === 'general') {
    return (
      <ClientServiceGeneralTab
        serviceId={serviceId}
        service={service}
        draft={draft}
        patchDraft={patchDraft}
        projects={projects}
        formDisabled={saving}
      />
    );
  }

  if (activeTab === 'invoices') {
    return (
      <ClientServiceInvoicesTab
        links={service.financeLinks}
        canCreateInvoice={service.billingModel === 'CLIENT_PAID'}
        creating={isActionBusy('invoice')}
        onCreate={() => onAction('invoice')}
      />
    );
  }

  if (activeTab === 'expenses') {
    return (
      <ClientServiceExpensesTab
        links={service.financeLinks}
        projectId={service.projectId}
        creatingPlan={isActionBusy('plan')}
        creatingExpense={isActionBusy('expense')}
        onCreatePlan={() => onAction('plan')}
        onCreateExpense={() => onAction('expense')}
      />
    );
  }

  return (
    <ClientServiceTasksTab
      links={service.financeLinks}
      canCreateTask={canCreateTask}
      creating={isActionBusy('task')}
      onCreate={() => onAction('task')}
    />
  );
}
