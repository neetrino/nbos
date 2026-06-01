'use client';

import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import type { Project } from '@/lib/api/projects';
import { ClientServiceGeneralTab } from './ClientServiceGeneralTab';
import { ClientServiceInvoicesTab } from './ClientServiceInvoicesTab';
import { ClientServiceExpensesTab } from './ClientServiceExpensesTab';
import { ClientServiceTasksTab } from './ClientServiceTasksTab';
import type { ClientServiceDetailSheetTab } from './client-service-detail-sheet-tabs';

interface ClientServiceDetailSheetBodyProps {
  activeTab: ClientServiceDetailSheetTab;
  serviceId: string;
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  projects: Project[];
  saving: boolean;
  canCreateTask: boolean;
  onCreateInvoice: () => void;
  onCreateExpensePlan: () => void;
  onCreateExpense: () => void;
  onCreateTask: () => void;
}

export function ClientServiceDetailSheetBody({
  activeTab,
  serviceId,
  service,
  draft,
  patchDraft,
  projects,
  saving,
  canCreateTask,
  onCreateInvoice,
  onCreateExpensePlan,
  onCreateExpense,
  onCreateTask,
}: ClientServiceDetailSheetBodyProps) {
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
        onCreate={onCreateInvoice}
      />
    );
  }

  if (activeTab === 'expenses') {
    return (
      <ClientServiceExpensesTab
        links={service.financeLinks}
        projectId={service.projectId}
        onCreatePlan={onCreateExpensePlan}
        onCreateExpense={onCreateExpense}
      />
    );
  }

  return (
    <ClientServiceTasksTab
      links={service.financeLinks}
      canCreateTask={canCreateTask}
      onCreateTask={onCreateTask}
    />
  );
}
