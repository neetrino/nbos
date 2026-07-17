'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  StatusBadge,
} from '@/components/shared';
import {
  getTicketCategory,
  getTicketCoverage,
  getTicketPriority,
  getTicketSlaState,
} from '@/features/support/constants/support';
import { auditApi, type AuditLogEntry } from '@/lib/api/audit';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { projectsApi, type ProjectProductSummary } from '@/lib/api/projects';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import {
  SUPPORT_TICKET_SHEET_CONTENT_CLASS,
  SUPPORT_TICKET_SHEET_RAIL_ANCHOR_CLASS,
} from '@/features/support/constants/support-ticket-sheet-layout';
import { SupportTicketCreateExecutionTaskDialog } from './support-ticket-create-execution-task-dialog';
import { SupportTicketDetailActivityTab } from './support-ticket-detail-activity-tab';
import { SupportTicketDetailGeneralTab } from './support-ticket-detail-general-tab';
import { SupportTicketPipelineStages } from './SupportTicketPipelineStages';
import { SupportTicketSheetQuickActions } from './SupportTicketSheetQuickActions';
import {
  buildSupportTicketTriageUpdatePatch,
  isSupportTriageDirty,
  triageDraftFromTicket,
  type SupportTriageDraft,
} from './support-ticket-detail-helpers';

export interface SupportTicketDetailSheetProps {
  ticketId: string | null;
  /** Kanban/list row for instant header while ticket detail hydrates. */
  initialTicket?: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey: number;
  meId: string | null;
  onListInvalidate: () => void;
  onStatusSelect: (ticket: SupportTicket, status: string) => void;
  onRequestResolve: (ticket: SupportTicket) => void;
  onRequestClose: (ticket: SupportTicket) => void;
  onRequestEscalate: (ticket: SupportTicket) => void;
  onRequestTechnical: (ticket: SupportTicket) => void;
}

export function SupportTicketDetailSheet({
  ticketId,
  initialTicket = null,
  open,
  onOpenChange,
  refreshKey,
  meId,
  onListInvalidate,
  onStatusSelect,
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
  const dirtyRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [auditItems, setAuditItems] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskBusy, setTaskBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'activity'>('general');

  const supportTicketTabs = [
    { value: 'general', label: 'General' },
    { value: 'activity', label: 'Activity' },
  ] as const;

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    setError(null);
    try {
      const row = await supportApi.getById(ticketId);
      setTicket(row);
      if (!dirtyRef.current) {
        const d = triageDraftFromTicket(row);
        setSnap(d);
        setDraft(d);
      }
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Ticket could not be loaded.'));
      if (!initialTicket || initialTicket.id !== ticketId) {
        setTicket(null);
        setSnap(null);
        setDraft(null);
      }
    } finally {
      setLoading(false);
    }
  }, [initialTicket, ticketId]);

  useEffect(() => {
    if (!open || !ticketId) {
      setTicket(null);
      setSnap(null);
      setDraft(null);
      setLoading(false);
      return;
    }

    setActiveTab('general');
    dirtyRef.current = false;

    const seed = initialTicket?.id === ticketId ? initialTicket : null;
    if (seed) {
      setTicket(seed);
      const d = triageDraftFromTicket(seed);
      setSnap(d);
      setDraft(d);
      setLoading(false);
    } else {
      setTicket(null);
      setSnap(null);
      setDraft(null);
      setLoading(true);
    }

    void loadTicket();
  }, [open, ticketId, refreshKey, initialTicket, loadTicket]);

  useEffect(() => {
    if (!open || !ticket?.projectId) {
      setProductOptions([]);
      setEmployees([]);
      setContacts([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [proj, emps, cts] = await Promise.all([
          projectsApi.getById(ticket.projectId!),
          employeesApi.getAll({ pageSize: 300 }),
          contactsApi.getAll({ pageSize: 300 }),
        ]);
        if (cancelled) return;
        setProductOptions(proj.products ?? []);
        setEmployees(emps.items);
        setContacts(cts.items);
      } catch {
        if (!cancelled) {
          setProductOptions([]);
          setEmployees([]);
          setContacts([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, ticket?.id, ticket?.projectId]);

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

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

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
  const cov = ticket ? getTicketCoverage(ticket.coverageDecision) : undefined;
  const sla = ticket ? getTicketSlaState(ticket.slaState.state) : undefined;

  const sourcePageHref =
    ticketId && ticketId.length > 0
      ? `/support?${SUPPORT_TICKET_OPEN_QUERY}=${encodeURIComponent(ticketId)}`
      : '/support';
  const workspaceHref =
    ticket?.projectId && ticket.projectId.length > 0 ? `/projects/${ticket.projectId}` : null;

  const handlePipelineSelect = useCallback(
    (status: string) => {
      if (!ticket || ticket.status === status) return;
      onStatusSelect(ticket, status);
    },
    [onStatusSelect, ticket],
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          contentClassName={SUPPORT_TICKET_SHEET_CONTENT_CLASS}
          railAnchorClassName={SUPPORT_TICKET_SHEET_RAIL_ANCHOR_CLASS}
          sourcePageHref={sourcePageHref}
          workspaceHref={workspaceHref}
        >
          <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden border-l">
            <div className="bg-background shrink-0 px-7 pt-5 pb-3">
              {loading && !ticket ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : ticket ? (
                <div className="min-w-0">
                  <div className="flex h-8 min-w-0 flex-nowrap items-center gap-3">
                    <h2 className="text-foreground max-w-[min(100%,32rem)] min-w-0 truncate text-xl leading-8 font-bold tracking-tight">
                      {ticket.title}
                    </h2>
                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                      {cat ? (
                        <StatusBadge
                          label={cat.label}
                          variant={cat.variant}
                          className="shrink-0 self-center"
                        />
                      ) : null}
                      {pri ? (
                        <StatusBadge
                          label={pri.label}
                          variant={pri.variant}
                          className="shrink-0 self-center"
                        />
                      ) : null}
                      {cov ? (
                        <StatusBadge
                          label={cov.label}
                          variant={cov.variant}
                          className="shrink-0 self-center"
                        />
                      ) : null}
                      {sla ? (
                        <StatusBadge
                          label={sla.label}
                          variant={sla.variant}
                          className="shrink-0 self-center"
                        />
                      ) : null}
                      <SupportTicketSheetQuickActions
                        ticket={ticket}
                        onRequestEscalate={onRequestEscalate}
                        onRequestTechnical={onRequestTechnical}
                        onRequestResolve={onRequestResolve}
                        onRequestClose={onRequestClose}
                        onReloadTicket={loadTicket}
                        onListInvalidate={onListInvalidate}
                      />
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-1.5 font-mono text-xs tracking-wide">
                    {ticket.code}
                    {ticket.project ? (
                      <>
                        <span className="mx-1.5 font-sans">·</span>
                        {ticket.project.name}
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No ticket</p>
              )}
            </div>

            {ticket ? (
              <div className="shrink-0 pb-3">
                <SupportTicketPipelineStages
                  currentStatus={ticket.status}
                  disabled={saving}
                  onSelect={handlePipelineSelect}
                />
              </div>
            ) : null}

            {error ? <p className="text-destructive shrink-0 px-6 py-2 text-sm">{error}</p> : null}

            {ticket && draft ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <DetailSheetTabBar
                  tabs={supportTicketTabs}
                  activeTab={activeTab}
                  onTabChange={(value) => {
                    const next = value as 'general' | 'activity';
                    setActiveTab(next);
                    if (next === 'activity') void loadAudit();
                  }}
                />

                <DetailSheetTabPanel
                  tabKey={activeTab}
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  {activeTab === 'general' ? (
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
                    />
                  ) : null}

                  {activeTab === 'activity' ? (
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                      <SupportTicketDetailActivityTab loading={auditLoading} items={auditItems} />
                    </div>
                  ) : null}
                </DetailSheetTabPanel>
              </div>
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
