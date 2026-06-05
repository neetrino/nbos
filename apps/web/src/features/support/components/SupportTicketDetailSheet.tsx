'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityDetailSheetContent, StatusBadge } from '@/components/shared';
import {
  getTicketCategory,
  getTicketCoverage,
  getTicketPriority,
  getTicketSlaState,
  getTicketStatus,
} from '@/features/support/constants/support';
import { auditApi, type AuditLogEntry } from '@/lib/api/audit';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { projectsApi, type ProjectProductSummary } from '@/lib/api/projects';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { SupportTicketCreateExecutionTaskDialog } from './support-ticket-create-execution-task-dialog';
import { SupportTicketDetailActivityTab } from './support-ticket-detail-activity-tab';
import { SupportTicketDetailGeneralTab } from './support-ticket-detail-general-tab';
import {
  buildSupportTicketTriageUpdatePatch,
  isSupportTriageDirty,
  triageDraftFromTicket,
  type SupportTriageDraft,
} from './support-ticket-detail-helpers';

export interface SupportTicketDetailSheetProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey: number;
  meId: string | null;
  onListInvalidate: () => void;
  onRequestResolve: (ticket: SupportTicket) => void;
  onRequestClose: (ticket: SupportTicket) => void;
  onRequestEscalate: (ticket: SupportTicket) => void;
  onRequestTechnical: (ticket: SupportTicket) => void;
}

export function SupportTicketDetailSheet({
  ticketId,
  open,
  onOpenChange,
  refreshKey,
  meId,
  onListInvalidate,
  onRequestResolve,
  onRequestClose,
  onRequestEscalate,
  onRequestTechnical,
}: SupportTicketDetailSheetProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [snap, setSnap] = useState<SupportTriageDraft | null>(null);
  const [draft, setDraft] = useState<SupportTriageDraft | null>(null);
  const [productOptions, setProductOptions] = useState<ProjectProductSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [auditItems, setAuditItems] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskBusy, setTaskBusy] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const row = await supportApi.getById(ticketId);
      setTicket(row);
      const d = triageDraftFromTicket(row);
      setSnap(d);
      setDraft(d);
      const [proj, emps, cts] = await Promise.all([
        projectsApi.getById(row.projectId),
        employeesApi.getAll({ pageSize: 300 }),
        contactsApi.getAll({ pageSize: 300 }),
      ]);
      setProductOptions(proj.products ?? []);
      setEmployees(emps.items);
      setContacts(cts.items);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Ticket could not be loaded.'));
      setTicket(null);
      setSnap(null);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!open || !ticketId) return;
    void loadTicket();
  }, [open, ticketId, refreshKey, loadTicket]);

  const loadAudit = useCallback(async () => {
    if (!ticketId) return;
    setAuditLoading(true);
    try {
      const res = await auditApi.findByEntity('SupportTicket', ticketId, { pageSize: 40 });
      setAuditItems(res.items);
    } catch {
      setAuditItems([]);
    } finally {
      setAuditLoading(false);
    }
  }, [ticketId]);

  const dirty = useMemo(
    () => draft != null && snap != null && isSupportTriageDirty(draft, snap),
    [draft, snap],
  );

  const patchDraft = useCallback((partial: Partial<SupportTriageDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const handleSave = useCallback(async () => {
    if (!ticketId || !draft || !snap) return;
    const patch = buildSupportTicketTriageUpdatePatch(draft, snap);
    if (Object.keys(patch).length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await supportApi.update(ticketId, patch);
      setTicket(updated);
      const next = triageDraftFromTicket(updated);
      setSnap(next);
      setDraft(next);
      onListInvalidate();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not save ticket.'));
    } finally {
      setSaving(false);
    }
  }, [draft, onListInvalidate, snap, ticketId]);

  const handleCancel = useCallback(() => {
    if (snap) setDraft({ ...snap });
    setError(null);
  }, [snap]);

  const submitCreateTask = useCallback(async () => {
    if (!ticketId || !meId) return;
    setTaskBusy(true);
    setError(null);
    try {
      await supportApi.createExecutionTask(ticketId, {
        creatorId: meId,
        title: taskTitle.trim() || undefined,
        description: taskDescription.trim() || undefined,
        dueDate: taskDue.trim() ? taskDue : null,
      });
      setTaskDialogOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskDue('');
      await loadTicket();
      onListInvalidate();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Execution task could not be created.'));
    } finally {
      setTaskBusy(false);
    }
  }, [loadTicket, meId, onListInvalidate, taskDescription, taskDue, taskTitle, ticketId]);

  const cat = ticket ? getTicketCategory(ticket.category) : undefined;
  const pri = ticket ? getTicketPriority(ticket.priority) : undefined;
  const st = ticket ? getTicketStatus(ticket.status) : undefined;
  const cov = ticket ? getTicketCoverage(ticket.coverageDecision) : undefined;
  const sla = ticket ? getTicketSlaState(ticket.slaState.state) : undefined;

  const sourcePageHref =
    ticketId && ticketId.length > 0
      ? `/support?${SUPPORT_TICKET_OPEN_QUERY}=${encodeURIComponent(ticketId)}`
      : '/support';
  const workspaceHref =
    ticket?.projectId && ticket.projectId.length > 0 ? `/projects/${ticket.projectId}` : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          sourcePageHref={sourcePageHref}
          workspaceHref={workspaceHref}
        >
          <div className="border-border flex h-full min-h-0 flex-col border-l">
            <div className="border-border bg-background shrink-0 border-b px-7 pt-5 pb-3">
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : ticket ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-foreground line-clamp-2 text-xl font-bold tracking-tight">
                      {ticket.title}
                    </h2>
                    <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wide">
                      {ticket.code}
                      <span className="mx-1.5 font-sans">·</span>
                      {ticket.project.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat && <StatusBadge label={cat.label} variant={cat.variant} />}
                    {pri && <StatusBadge label={pri.label} variant={pri.variant} />}
                    {st && <StatusBadge label={st.label} variant={st.variant} />}
                    {cov && <StatusBadge label={cov.label} variant={cov.variant} />}
                    {sla && <StatusBadge label={sla.label} variant={sla.variant} />}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No ticket</p>
              )}
            </div>

            {error ? <p className="text-destructive shrink-0 px-6 py-2 text-sm">{error}</p> : null}

            {ticket && draft ? (
              <Tabs
                defaultValue="general"
                className="flex min-h-0 flex-1 flex-col"
                onValueChange={(v) => {
                  if (v === 'activity') void loadAudit();
                }}
              >
                <TabsList className="mx-6 mt-3 shrink-0 self-start">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="general"
                  className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                >
                  <SupportTicketDetailGeneralTab
                    ticket={ticket}
                    draft={draft}
                    dirty={dirty}
                    saving={saving}
                    employees={employees}
                    contacts={contacts}
                    productOptions={productOptions}
                    meId={meId}
                    taskBusy={taskBusy}
                    onPatchDraft={patchDraft}
                    onSave={() => void handleSave()}
                    onCancel={handleCancel}
                    onOpenCreateTask={() => setTaskDialogOpen(true)}
                    onListInvalidate={onListInvalidate}
                    onReloadTicket={loadTicket}
                    onRequestResolve={onRequestResolve}
                    onRequestClose={onRequestClose}
                    onRequestEscalate={onRequestEscalate}
                    onRequestTechnical={onRequestTechnical}
                  />
                </TabsContent>

                <TabsContent
                  value="activity"
                  className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                >
                  <ScrollArea className="min-h-0 flex-1">
                    <SupportTicketDetailActivityTab loading={auditLoading} items={auditItems} />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : null}
          </div>
        </EntityDetailSheetContent>
      </Sheet>

      <SupportTicketCreateExecutionTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        meId={meId}
        busy={taskBusy}
        title={taskTitle}
        description={taskDescription}
        dueDate={taskDue}
        onTitleChange={setTaskTitle}
        onDescriptionChange={setTaskDescription}
        onDueDateChange={setTaskDue}
        onSubmit={() => void submitCreateTask()}
      />
    </>
  );
}
