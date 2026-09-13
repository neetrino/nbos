'use client';

import { Headphones } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetFormFooter, DetailSheetSection } from '@/components/shared';
import type { Contact } from '@/lib/api/clients';
import type { Employee } from '@/lib/api/employees';
import type { ProjectProductSummary } from '@/lib/api/projects';
import type { SupportTicket } from '@/lib/api/support';
import type { SupportTriageDraft } from './support-ticket-detail-helpers';
import {
  SupportTicketChangeControlSection,
  SupportTicketExecutionTasksSection,
  SupportTicketWaitingOverlaySection,
} from './support-ticket-detail-side-panels';
import { SupportTicketDetailTriageFields } from './support-ticket-detail-triage-fields';
import { SupportTicketSourceMessages } from './SupportTicketSourceMessages';

export interface SupportTicketDetailGeneralTabProps {
  ticket: SupportTicket;
  draft: SupportTriageDraft;
  dirty: boolean;
  saving: boolean;
  employees: Employee[];
  contacts: Contact[];
  productOptions: ProjectProductSummary[];
  meId: string | null;
  taskBusy: boolean;
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
  onOpenCreateTask: () => void;
  onListInvalidate: () => void;
  onReloadTicket: () => Promise<void>;
}

export function SupportTicketDetailGeneralTab({
  ticket,
  draft,
  dirty,
  saving,
  meId,
  taskBusy,
  onPatchDraft,
  onSave,
  onCancel,
  onOpenCreateTask,
  onListInvalidate,
  onReloadTicket,
}: SupportTicketDetailGeneralTabProps) {
  const t = useTranslations('support');
  const terminal = ['RESOLVED', 'CLOSED'].includes(ticket.status);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="space-y-4 px-5 py-4 sm:px-7">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-5">
            <div className="flex flex-col gap-4 xl:col-span-8">
              <DetailSheetSection title={t('sheet.caseAndTriage')} icon={<Headphones size={12} />}>
                <div className="space-y-4">
                  <SupportTicketDetailTriageFields
                    key={ticket.id}
                    draft={draft}
                    terminal={terminal}
                    projectId={ticket.projectId}
                    assigneeLabel={
                      ticket.assignee
                        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                        : null
                    }
                    assigneeAvatar={ticket.assignee?.avatar ?? null}
                    productLabel={ticket.product?.name ?? null}
                    contactLabel={
                      ticket.contact
                        ? `${ticket.contact.firstName} ${ticket.contact.lastName}`
                        : null
                    }
                    onPatchDraft={onPatchDraft}
                  />
                </div>
              </DetailSheetSection>
            </div>

            <div className="flex flex-col gap-4 xl:col-span-4">
              <SupportTicketWaitingOverlaySection
                ticket={ticket}
                terminal={terminal}
                onListInvalidate={onListInvalidate}
                onReloadTicket={onReloadTicket}
              />
              <SupportTicketChangeControlSection
                ticket={ticket}
                terminal={terminal}
                meId={meId}
                onListInvalidate={onListInvalidate}
                onReloadTicket={onReloadTicket}
              />
              <SupportTicketExecutionTasksSection
                ticket={ticket}
                terminal={terminal}
                meId={meId}
                taskBusy={taskBusy}
                onOpenCreateTask={onOpenCreateTask}
              />
              <SupportTicketSourceMessages key={ticket.id} ticketId={ticket.id} />
            </div>
          </div>
        </div>
      </div>
      <DetailSheetFormFooter
        visible
        dirty={dirty}
        saving={saving}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}
