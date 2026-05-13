'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckSquare,
  ExternalLink,
  FilePlus2,
  Headphones,
  RotateCcw,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DetailSheetFormFooter, DetailSheetSection } from '@/components/shared';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { TASK_OPEN_QUERY } from '@/features/tasks/constants/task-open-query';
import { supportApi } from '@/lib/api/support';
import type { Contact } from '@/lib/api/clients';
import type { Employee } from '@/lib/api/employees';
import type { ProjectProductSummary } from '@/lib/api/projects';
import type { SupportTicket } from '@/lib/api/support';
import type { Task } from '@/lib/api/tasks';
import type { SupportTriageDraft } from './support-ticket-detail-helpers';
import { SupportTicketDetailTriageFields } from './support-ticket-detail-triage-fields';

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
  onRequestResolve: (ticket: SupportTicket) => void;
  onRequestClose: (ticket: SupportTicket) => void;
  onRequestEscalate: (ticket: SupportTicket) => void;
  onRequestTechnical: (ticket: SupportTicket) => void;
}

export function SupportTicketDetailGeneralTab({
  ticket,
  draft,
  dirty,
  saving,
  employees,
  contacts,
  productOptions,
  meId,
  taskBusy,
  onPatchDraft,
  onSave,
  onCancel,
  onOpenCreateTask,
  onListInvalidate,
  onReloadTicket,
  onRequestResolve,
  onRequestClose,
  onRequestEscalate,
  onRequestTechnical,
}: SupportTicketDetailGeneralTabProps) {
  const terminal = ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const executionTasks = ticket.executionTasks ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-5 py-4 sm:px-7">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-5">
            <div className="flex flex-col gap-4 xl:col-span-7">
              <DetailSheetSection title="Case & triage" icon={<Headphones size={12} />}>
                <div className="space-y-4">
                  <SupportTicketDetailTriageFields
                    draft={draft}
                    terminal={terminal}
                    employees={employees}
                    contacts={contacts}
                    productOptions={productOptions}
                    onPatchDraft={onPatchDraft}
                  />
                </div>
              </DetailSheetSection>
            </div>

            <div className="flex flex-col gap-4 xl:col-span-5">
              <DetailSheetSection title="Quick actions">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={terminal}
                    onClick={() => onRequestEscalate(ticket)}
                  >
                    <AlertTriangle size={14} />
                    Escalate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={terminal}
                    onClick={() => onRequestTechnical(ticket)}
                  >
                    <Server size={14} />
                    Technical
                  </Button>
                  {terminal ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void (async () => {
                          await supportApi.reopen(ticket.id);
                          await onReloadTicket();
                          onListInvalidate();
                        })();
                      }}
                    >
                      <RotateCcw size={14} />
                      Reopen
                    </Button>
                  ) : null}
                  {!terminal ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestResolve(ticket)}
                    >
                      Mark resolved
                    </Button>
                  ) : null}
                  {ticket.status === 'RESOLVED' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestClose(ticket)}
                    >
                      Close
                    </Button>
                  ) : null}
                </div>
              </DetailSheetSection>

              <DetailSheetSection title="Change control" icon={<FilePlus2 size={12} />}>
                {ticket.extensionDeal ? (
                  <Link
                    href={`/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(ticket.extensionDeal.id)}`}
                    className="text-primary inline-flex items-center gap-1 text-sm font-medium"
                  >
                    Deal {ticket.extensionDeal.code}
                    <ExternalLink size={12} />
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {ticket.category === 'CHANGE_REQUEST'
                      ? 'Create an Extension Deal from the list or change-control page when product context is set.'
                      : 'Not a change request.'}
                  </p>
                )}
              </DetailSheetSection>

              <DetailSheetSection title="Execution tasks" icon={<CheckSquare size={12} />}>
                <div className="mb-3 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!meId || terminal || taskBusy}
                    onClick={onOpenCreateTask}
                  >
                    <CheckSquare size={14} />
                    New task
                  </Button>
                </div>
                {executionTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No linked tasks yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {executionTasks.map((task: Task) => (
                      <li
                        key={task.id}
                        className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{task.title}</p>
                          <p className="text-muted-foreground text-xs">{task.code}</p>
                        </div>
                        <Link
                          href={`/tasks?${TASK_OPEN_QUERY}=${encodeURIComponent(task.id)}`}
                          className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium"
                        >
                          Open
                          <ExternalLink size={12} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSheetSection>
            </div>
          </div>
        </div>
      </ScrollArea>
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
