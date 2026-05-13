'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Headphones,
  LayoutGrid,
  List,
  FolderKanban,
  CheckSquare,
  FilePlus2,
  RotateCcw,
  AlertTriangle,
  Server,
  PanelRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PageHeader,
  FilterBar,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  KanbanBoard,
} from '@/components/shared';
import {
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WAITING_STATES,
  TICKET_WAITING_OVERLAY_OPTIONS,
  getTicketCategory,
  getTicketCloseReasonLabel,
  getTicketCoverage,
  getTicketPriority,
  getTicketSlaState,
  getTicketStatus,
  getTicketWaitingState,
  MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH,
  SUPPORT_TICKET_CLOSE_REASON_OPTIONS,
} from '@/features/support/constants/support';
import { supportApi, type SupportStats, type SupportTicket } from '@/lib/api/support';
import { projectsApi, type Project, type ProjectProductSummary } from '@/lib/api/projects';
import { technicalApi, type TechnicalProductProfileResponse } from '@/lib/api/technical';
import { useSupportScopeStatsCsvExport } from '@/features/support/use-support-scope-stats-csv-export';
import { usePermission } from '@/lib/permissions';
import { getApiErrorMessage } from '@/lib/api-errors';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';
import { SupportPageSettingsDialog } from '@/features/support/components/SupportPageSettingsDialog';
import { SupportTicketDetailSheet } from '@/features/support/components/SupportTicketDetailSheet';
import { contactsApi, type Contact } from '@/lib/api/clients';

type ViewMode = 'kanban' | 'list';

export default function SupportPage() {
  const searchParams = useSearchParams();
  const portfolioProjectIdFromUrl = searchParams.get(PORTFOLIO_DEEP_LINK.projectId)?.trim() ?? null;
  const portfolioCreateTicketFromUrl = searchParams.get(PORTFOLIO_DEEP_LINK.createTicket) === '1';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('list');
  const [actionId, setActionId] = useState<string | null>(null);
  const [escalateTicket, setEscalateTicket] = useState<SupportTicket | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [technicalTicket, setTechnicalTicket] = useState<SupportTicket | null>(null);
  const [technicalProfile, setTechnicalProfile] = useState<TechnicalProductProfileResponse | null>(
    null,
  );
  const [technicalProfileLoading, setTechnicalProfileLoading] = useState(false);
  const [draftTechnicalAssetId, setDraftTechnicalAssetId] = useState('');
  const [draftTechnicalEnvId, setDraftTechnicalEnvId] = useState('');
  const [projectsForFilters, setProjectsForFilters] = useState<Project[]>([]);
  const [productFilterOptions, setProductFilterOptions] = useState<ProjectProductSummary[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createProjectId, setCreateProjectId] = useState('');
  const [createProductId, setCreateProductId] = useState('');
  const [createCategory, setCreateCategory] = useState('UNCLASSIFIED');
  const [createPriority, setCreatePriority] = useState('P3');
  const [createDescription, setCreateDescription] = useState('');
  const [createCoverageDecision, setCreateCoverageDecision] = useState('');
  const [createContactId, setCreateContactId] = useState('');
  const [createProductOptions, setCreateProductOptions] = useState<ProjectProductSummary[]>([]);
  const [createContacts, setCreateContacts] = useState<Contact[]>([]);
  const [statusDialog, setStatusDialog] = useState<null | {
    ticket: SupportTicket;
    mode: 'RESOLVED' | 'CLOSED';
  }>(null);
  const [statusResolutionDraft, setStatusResolutionDraft] = useState('');
  const [statusCloseReason, setStatusCloseReason] = useState('CLIENT_CONFIRMED');
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const { me } = usePermission();

  const { handleExportScopeStatsCsv } = useSupportScopeStatsCsvExport(stats);

  const fetchTickets = useCallback(
    async (options?: { soft?: boolean }) => {
      if (!options?.soft) setLoading(true);
      try {
        const { items } = await supportApi.getAll({
          pageSize: 100,
          search: search || undefined,
          projectId:
            filters.projectId && filters.projectId !== 'all' ? filters.projectId : undefined,
          productId:
            filters.productId && filters.productId !== 'all' ? filters.productId : undefined,
          category: filters.category && filters.category !== 'all' ? filters.category : undefined,
          priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          waitingState:
            filters.waitingState && filters.waitingState !== 'all'
              ? filters.waitingState
              : undefined,
        });
        setTickets(items);
        setError(null);
        try {
          setStats(await supportApi.getStats());
        } catch {
          setStats(null);
        }
      } catch {
        setError('Support tickets could not be loaded. Check your connection and try again.');
        setStats(null);
      } finally {
        if (!options?.soft) setLoading(false);
      }
    },
    [search, filters],
  );

  const refreshSupportViews = useCallback(async () => {
    await fetchTickets({ soft: true });
    setDetailRefreshKey((k) => k + 1);
  }, [fetchTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!createOpen) return;
    let cancelled = false;
    void contactsApi.getAll({ pageSize: 200 }).then((res) => {
      if (!cancelled) setCreateContacts(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, [createOpen]);

  useEffect(() => {
    if (!technicalTicket?.productId) {
      setTechnicalProfile(null);
      return;
    }
    let cancelled = false;
    setTechnicalProfileLoading(true);
    void technicalApi
      .getProductProfile(technicalTicket.productId)
      .then((profile) => {
        if (!cancelled) setTechnicalProfile(profile);
      })
      .catch(() => {
        if (!cancelled) setTechnicalProfile(null);
      })
      .finally(() => {
        if (!cancelled) setTechnicalProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [technicalTicket]);

  useEffect(() => {
    let cancelled = false;
    void projectsApi.getAll({ pageSize: 200 }).then((res) => {
      if (!cancelled) setProjectsForFilters(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const pid = filters.projectId;
    if (!pid || pid === 'all') {
      setProductFilterOptions([]);
      return;
    }
    let cancelled = false;
    void projectsApi.getById(pid).then((p) => {
      if (!cancelled) setProductFilterOptions(p.products ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [filters.projectId]);

  useEffect(() => {
    if (!createProjectId) {
      setCreateProductOptions([]);
      return;
    }
    let cancelled = false;
    void projectsApi.getById(createProjectId).then((p) => {
      if (!cancelled) setCreateProductOptions(p.products ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [createProjectId]);

  useEffect(() => {
    setCreateProductId('');
  }, [createProjectId]);

  useEffect(() => {
    if (!createOpen) return;
    const urlProject =
      portfolioCreateTicketFromUrl && portfolioProjectIdFromUrl ? portfolioProjectIdFromUrl : '';
    const projectOk =
      urlProject && projectsForFilters.some((p) => p.id === urlProject) ? urlProject : '';
    setCreateTitle('');
    setCreateProjectId(projectOk);
    setCreateProductId('');
    setCreateCategory('UNCLASSIFIED');
    setCreatePriority('P3');
    setCreateDescription('');
    setCreateCoverageDecision('');
    setCreateContactId('');
    setCreateProductOptions([]);
  }, [createOpen, portfolioCreateTicketFromUrl, portfolioProjectIdFromUrl, projectsForFilters]);

  useEffect(() => {
    if (!portfolioCreateTicketFromUrl || !portfolioProjectIdFromUrl || loading) return;
    if (!projectsForFilters.some((p) => p.id === portfolioProjectIdFromUrl)) return;
    setCreateOpen(true);
  }, [portfolioCreateTicketFromUrl, portfolioProjectIdFromUrl, loading, projectsForFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'projectId') next.productId = 'all';
      return next;
    });
  };

  const filterConfigs = useMemo(
    () => [
      {
        key: 'category',
        label: 'Category',
        options: TICKET_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
      },
      {
        key: 'priority',
        label: 'Priority',
        options: TICKET_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
      },
      {
        key: 'status',
        label: 'Status',
        options: TICKET_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      },
      {
        key: 'waitingState',
        label: 'Waiting',
        options: TICKET_WAITING_STATES.map((w) => ({ value: w.value, label: w.label })),
      },
      {
        key: 'projectId',
        label: 'Project',
        options: projectsForFilters.map((p) => ({
          value: p.id,
          label: `${p.code} · ${p.name}`,
        })),
      },
      {
        key: 'productId',
        label: 'Product',
        options: productFilterOptions.map((p) => ({ value: p.id, label: p.name })),
      },
    ],
    [projectsForFilters, productFilterOptions],
  );

  const patchTicketStatus = async (
    id: string,
    status: string,
    extra?: { resolutionSummary?: string; closeReason?: string },
  ): Promise<boolean> => {
    setActionId(`status:${id}`);
    try {
      await supportApi.updateStatus(id, status, extra);
      setError(null);
      await refreshSupportViews();
      return true;
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Status could not be updated.'));
      return false;
    } finally {
      setActionId(null);
    }
  };

  const handleStatusSelect = (ticket: SupportTicket, next: string) => {
    if (next === ticket.status) return;
    if (next === 'RESOLVED') {
      setStatusResolutionDraft(ticket.resolutionSummary ?? '');
      setStatusDialog({ ticket, mode: 'RESOLVED' });
      return;
    }
    if (next === 'CLOSED') {
      if (ticket.status !== 'RESOLVED') {
        setError(
          'Move the ticket to Resolved before Closed (extension delivery may close it automatically).',
        );
        return;
      }
      setStatusCloseReason('CLIENT_CONFIRMED');
      setStatusDialog({ ticket, mode: 'CLOSED' });
      return;
    }
    void patchTicketStatus(ticket.id, next);
  };

  const submitResolveDialog = async () => {
    if (!statusDialog || statusDialog.mode !== 'RESOLVED') return;
    const text = statusResolutionDraft.trim();
    if (text.length < MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH) {
      setError(
        `Resolution summary must be at least ${MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH} characters.`,
      );
      return;
    }
    const ok = await patchTicketStatus(statusDialog.ticket.id, 'RESOLVED', {
      resolutionSummary: text,
    });
    if (ok) setStatusDialog(null);
  };

  const submitCloseDialog = async () => {
    if (!statusDialog || statusDialog.mode !== 'CLOSED') return;
    const ok = await patchTicketStatus(statusDialog.ticket.id, 'CLOSED', {
      closeReason: statusCloseReason,
    });
    if (ok) setStatusDialog(null);
  };

  const submitCreateTicket = async () => {
    const title = createTitle.trim();
    if (!title || !createProjectId) {
      setError('Title and project are required to create a ticket.');
      return;
    }
    setActionId('create-ticket');
    try {
      await supportApi.create({
        title,
        projectId: createProjectId,
        category: createCategory,
        priority: createPriority,
        description: createDescription.trim() || undefined,
        productId: createProductId || undefined,
        coverageDecision: createCoverageDecision || undefined,
        contactId: createContactId || undefined,
      });
      setCreateOpen(false);
      setError(null);
      await refreshSupportViews();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Ticket could not be created.'));
    } finally {
      setActionId(null);
    }
  };

  const handleKanbanMove = (itemId: string, _from: string, toColumn: string) => {
    const ticket = tickets.find((t) => t.id === itemId);
    if (!ticket) return;
    handleStatusSelect(ticket, toColumn);
  };

  const openTechnicalDialog = (ticket: SupportTicket) => {
    setTechnicalTicket(ticket);
    setDraftTechnicalAssetId(ticket.technicalAsset?.id ?? '');
    setDraftTechnicalEnvId(ticket.technicalEnvironment?.id ?? '');
  };

  const saveTechnicalContext = async () => {
    if (!technicalTicket?.productId) return;
    setActionId(`tech:${technicalTicket.id}`);
    try {
      await supportApi.update(technicalTicket.id, {
        technicalAssetId: draftTechnicalAssetId || null,
        technicalEnvironmentId: draftTechnicalEnvId || null,
      });
      setTechnicalTicket(null);
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Technical context could not be saved.'));
    } finally {
      setActionId(null);
    }
  };

  const openTickets = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status));

  const kanbanColumns = TICKET_STATUSES.map((status) => ({
    key: status.value,
    label: status.label,
    color: status.color,
    items: tickets.filter((t) => t.status === status.value),
  }));

  const handleCreateExecutionTask = async (ticket: SupportTicket) => {
    if (!me?.id) return;
    setActionId(ticket.id);
    try {
      await supportApi.createExecutionTask(ticket.id, { creatorId: me.id });
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Execution task could not be created.'));
    } finally {
      setActionId(null);
    }
  };

  const handleCreateExtensionDeal = async (ticket: SupportTicket) => {
    if (!me?.id) return;
    setActionId(`deal:${ticket.id}`);
    try {
      await supportApi.createExtensionDeal(ticket.id, { sellerId: me.id });
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Extension Deal could not be created.'));
    } finally {
      setActionId(null);
    }
  };

  const handleWaitingChange = async (ticket: SupportTicket, value: string) => {
    setActionId(`wait:${ticket.id}`);
    try {
      await supportApi.updateWaiting(ticket.id, { waitingState: value });
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Waiting state could not be updated.'));
    } finally {
      setActionId(null);
    }
  };

  const handleSubmitEscalation = async () => {
    if (!escalateTicket) return;
    setActionId(`escalate:${escalateTicket.id}`);
    try {
      await supportApi.escalate(escalateTicket.id, escalateReason.trim() || undefined);
      setEscalateTicket(null);
      setEscalateReason('');
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Escalation could not be recorded.'));
    } finally {
      setActionId(null);
    }
  };

  const handleReopenTicket = async (ticket: SupportTicket) => {
    setActionId(`reopen:${ticket.id}`);
    try {
      await supportApi.reopen(ticket.id);
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Ticket could not be reopened.'));
    } finally {
      setActionId(null);
    }
  };

  const openSupportDetail = (id: string) => {
    setDetailTicketId(id);
    setDetailOpen(true);
  };

  const handleSupportDetailOpenChange = (next: boolean) => {
    setDetailOpen(next);
    if (!next) setDetailTicketId(null);
  };

  const isInteractiveTableTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('button,select,a,input,textarea,[role="combobox"]'));
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="shrink-0">
        <PageHeader title="Support" description={`${openTickets.length} open tickets`}>
          <SupportPageSettingsDialog
            exportDisabled={loading || !stats}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
          />
          <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
            <TabsList variant="segmented">
              <TabsTrigger value="kanban" className="gap-1.5 px-3 py-2" aria-label="Board view">
                <LayoutGrid size={14} aria-hidden />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5 px-3 py-2" aria-label="List view">
                <List size={14} aria-hidden />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New Ticket
          </Button>
        </PageHeader>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Open Tickets</p>
          <p className="mt-1 text-xl font-bold">{openTickets.length}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Critical (P1)</p>
          <p className="mt-1 text-xl font-bold text-red-500">
            {
              tickets.filter(
                (t) => t.priority === 'P1' && !['RESOLVED', 'CLOSED'].includes(t.status),
              ).length
            }
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Tickets</p>
          <p className="mt-1 text-xl font-bold">{tickets.length}</p>
        </div>
      </div>

      <div className="shrink-0">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tickets..."
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTickets} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="No tickets yet"
          description="Support tickets will appear here"
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create First Ticket
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={kanbanColumns}
            getItemId={(t: SupportTicket) => t.id}
            onMove={handleKanbanMove}
            renderCard={(ticket: SupportTicket) => {
              const cat = getTicketCategory(ticket.category);
              const pri = getTicketPriority(ticket.priority);
              const coverage = getTicketCoverage(ticket.coverageDecision);
              const sla = getTicketSlaState(ticket.slaState.state);
              return (
                <div
                  className="border-border bg-card space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm"
                  onClick={(e) => {
                    if (isInteractiveTableTarget(e.target)) return;
                    openSupportDetail(ticket.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px] font-medium">
                      {ticket.code}
                    </span>
                    {pri && <StatusBadge label={pri.label} variant={pri.variant} />}
                  </div>
                  <p className="text-sm font-medium">{ticket.title}</p>
                  <div className="flex items-center gap-2">
                    {cat && <StatusBadge label={cat.label} variant={cat.variant} />}
                    {ticket.billable && <StatusBadge label="Billable" variant="amber" />}
                    {ticket.product && <StatusBadge label="Product" variant="blue" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {coverage && <StatusBadge label={coverage.label} variant={coverage.variant} />}
                    {sla && <StatusBadge label={sla.label} variant={sla.variant} />}
                  </div>
                  <label className="text-muted-foreground text-[10px] font-medium uppercase">
                    Waiting overlay
                  </label>
                  <select
                    className="border-border bg-background text-foreground w-full rounded-md border px-2 py-1.5 text-xs"
                    value={ticket.waitingState ?? 'NONE'}
                    onChange={(e) => void handleWaitingChange(ticket, e.target.value)}
                    disabled={
                      actionId === `wait:${ticket.id}` ||
                      ['RESOLVED', 'CLOSED'].includes(ticket.status)
                    }
                    aria-label="Waiting overlay"
                  >
                    {TICKET_WAITING_OVERLAY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {ticket.waitingReason ? (
                    <p className="text-muted-foreground line-clamp-2 text-[11px]">
                      {ticket.waitingReason}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={
                      ['RESOLVED', 'CLOSED'].includes(ticket.status) ||
                      actionId?.startsWith('escalate:')
                    }
                    onClick={() => {
                      setEscalateTicket(ticket);
                      setEscalateReason(ticket.waitingReason ?? '');
                    }}
                  >
                    <AlertTriangle size={12} />
                    Escalate
                  </Button>
                  {ticket.project && (
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <FolderKanban size={10} />
                      {ticket.project.name}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      !me?.id ||
                      actionId === ticket.id ||
                      ['RESOLVED', 'CLOSED'].includes(ticket.status)
                    }
                    onClick={() => void handleCreateExecutionTask(ticket)}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <CheckSquare size={12} />
                    Create task
                  </Button>
                  {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionId === `reopen:${ticket.id}`}
                      onClick={() => void handleReopenTicket(ticket)}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <RotateCcw size={12} />
                      Reopen
                    </Button>
                  )}
                  <SupportChangeControlAction
                    ticket={ticket}
                    busy={actionId === `deal:${ticket.id}`}
                    disabled={!me?.id}
                    onCreateDeal={handleCreateExtensionDeal}
                  />
                  <div className="text-muted-foreground flex flex-col gap-1 text-[10px]">
                    {(ticket.technicalAsset || ticket.technicalEnvironment) && (
                      <span>
                        {ticket.technicalAsset ? `Asset: ${ticket.technicalAsset.name}` : null}
                        {ticket.technicalAsset && ticket.technicalEnvironment ? ' · ' : null}
                        {ticket.technicalEnvironment
                          ? `Env: ${ticket.technicalEnvironment.name}`
                          : null}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      disabled={
                        ['RESOLVED', 'CLOSED'].includes(ticket.status) ||
                        actionId === `tech:${ticket.id}`
                      }
                      onClick={() => openTechnicalDialog(ticket)}
                    >
                      <Server size={12} />
                      Technical
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      ) : (
        <div className="border-border min-h-0 flex-1 overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Waiting</TableHead>
                <TableHead>Escalate</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Technical</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead>Execution</TableHead>
                <TableHead>Change Control</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const cat = getTicketCategory(ticket.category);
                const pri = getTicketPriority(ticket.priority);
                const st = getTicketStatus(ticket.status);
                const coverage = getTicketCoverage(ticket.coverageDecision);
                const sla = getTicketSlaState(ticket.slaState.state);
                const waiting = getTicketWaitingState(ticket.waitingState ?? 'NONE');
                return (
                  <TableRow
                    key={ticket.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={(e) => {
                      if (isInteractiveTableTarget(e.target)) return;
                      openSupportDetail(ticket.id);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{ticket.title}</p>
                          <p className="text-muted-foreground text-xs">{ticket.code}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 gap-1 px-2 text-xs"
                          title="Open ticket details"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSupportDetail(ticket.id);
                          }}
                        >
                          <PanelRight size={14} aria-hidden />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat && <StatusBadge label={cat.label} variant={cat.variant} />}
                    </TableCell>
                    <TableCell>
                      {pri && <StatusBadge label={pri.label} variant={pri.variant} />}
                    </TableCell>
                    <TableCell>
                      <select
                        className="border-border bg-background max-w-[168px] rounded-md border px-2 py-1 text-xs"
                        value={ticket.status}
                        onChange={(e) => handleStatusSelect(ticket, e.target.value)}
                        disabled={!!actionId?.startsWith('status:')}
                        aria-label="Ticket status"
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      {st ? (
                        <p className="text-muted-foreground mt-1 text-[10px]">{st.label}</p>
                      ) : null}
                      {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                        <div className="mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1 px-2 text-xs"
                            disabled={actionId === `reopen:${ticket.id}`}
                            onClick={() => void handleReopenTicket(ticket)}
                          >
                            <RotateCcw size={10} />
                            Reopen
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px] text-xs">
                      {ticket.resolutionSummary ? (
                        <p className="line-clamp-3">{ticket.resolutionSummary}</p>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {ticket.status === 'CLOSED' && ticket.closeReason ? (
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          {getTicketCloseReasonLabel(ticket.closeReason)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {sla && <StatusBadge label={sla.label} variant={sla.variant} />}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <select
                          className="border-border bg-background text-foreground max-w-[200px] rounded-md border px-2 py-1 text-xs"
                          value={ticket.waitingState ?? 'NONE'}
                          onChange={(e) => void handleWaitingChange(ticket, e.target.value)}
                          disabled={
                            actionId === `wait:${ticket.id}` ||
                            ['RESOLVED', 'CLOSED'].includes(ticket.status)
                          }
                          aria-label="Waiting overlay"
                        >
                          {TICKET_WAITING_OVERLAY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {waiting && waiting.value !== 'NONE' ? (
                          <span className="text-muted-foreground text-[10px]">{waiting.label}</span>
                        ) : null}
                        {ticket.waitingReason ? (
                          <span className="text-muted-foreground line-clamp-2 text-[10px]">
                            {ticket.waitingReason}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={
                          ['RESOLVED', 'CLOSED'].includes(ticket.status) ||
                          actionId === `escalate:${ticket.id}`
                        }
                        onClick={() => {
                          setEscalateTicket(ticket);
                          setEscalateReason(ticket.waitingReason ?? '');
                        }}
                      >
                        <AlertTriangle size={12} />
                        Escalate
                      </Button>
                    </TableCell>
                    <TableCell>
                      {coverage ? (
                        <StatusBadge label={coverage.label} variant={coverage.variant} />
                      ) : (
                        <StatusBadge label="Not decided" variant="gray" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.project?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.product?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[220px] flex-col gap-1">
                        {ticket.technicalAsset ? (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Asset: </span>
                            {ticket.technicalAsset.name}
                          </p>
                        ) : null}
                        {ticket.technicalEnvironment ? (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Env: </span>
                            {ticket.technicalEnvironment.name}
                          </p>
                        ) : null}
                        {!ticket.technicalAsset && !ticket.technicalEnvironment ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          disabled={
                            ['RESOLVED', 'CLOSED'].includes(ticket.status) ||
                            actionId === `tech:${ticket.id}`
                          }
                          onClick={() => openTechnicalDialog(ticket)}
                          title={
                            ticket.productId
                              ? 'Link technical asset / environment'
                              : 'Product context required'
                          }
                        >
                          <Server size={12} />
                          Context
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ticket.assignee
                        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {ticket.billable ? (
                        <StatusBadge label="Paid" variant="amber" />
                      ) : (
                        <StatusBadge label="Free" variant="gray" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          !me?.id ||
                          actionId === ticket.id ||
                          ['RESOLVED', 'CLOSED'].includes(ticket.status)
                        }
                        onClick={() => void handleCreateExecutionTask(ticket)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <CheckSquare size={12} />
                        Task
                      </Button>
                    </TableCell>
                    <TableCell>
                      <SupportChangeControlAction
                        ticket={ticket}
                        busy={actionId === `deal:${ticket.id}`}
                        disabled={!me?.id}
                        onCreateDeal={handleCreateExtensionDeal}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!escalateTicket}
        onOpenChange={(open) => {
          if (!open) {
            setEscalateTicket(null);
            setEscalateReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Managerial escalation</DialogTitle>
            <DialogDescription>
              Sends in-app notifications to the assignee and users with global Support ticket
              access. The ticket is marked Escalated and the SLA clock pauses until the overlay is
              cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="support-escalate-reason">Reason</Label>
            <Textarea
              id="support-escalate-reason"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              rows={3}
              placeholder="Business risk, needs another specialist, client urgency…"
              className="resize-y"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEscalateTicket(null);
                setEscalateReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!escalateTicket || !!actionId?.startsWith('escalate:')}
              onClick={() => void handleSubmitEscalation()}
            >
              Confirm escalation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!technicalTicket}
        onOpenChange={(open) => {
          if (!open) setTechnicalTicket(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Technical context</DialogTitle>
            <DialogDescription>
              Link this incident to a Technical Asset and/or Environment registered for the same
              product (Projects → Product → Technical).
            </DialogDescription>
          </DialogHeader>
          {!technicalTicket?.productId ? (
            <p className="text-muted-foreground text-sm">
              This ticket has no product context. Set a product on the ticket before linking assets
              or environments.
            </p>
          ) : technicalProfileLoading ? (
            <p className="text-muted-foreground text-sm">Loading technical profile…</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="support-tech-asset">Asset</Label>
                <select
                  id="support-tech-asset"
                  className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                  value={draftTechnicalAssetId}
                  onChange={(e) => setDraftTechnicalAssetId(e.target.value)}
                >
                  <option value="">None</option>
                  {technicalProfile?.assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type} — {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="support-tech-env">Environment</Label>
                <select
                  id="support-tech-env"
                  className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                  value={draftTechnicalEnvId}
                  onChange={(e) => setDraftTechnicalEnvId(e.target.value)}
                >
                  <option value="">None</option>
                  {technicalProfile?.environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.kind} — {env.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTechnicalTicket(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !technicalTicket?.productId ||
                !!actionId?.startsWith('tech:') ||
                technicalProfileLoading
              }
              onClick={() => void saveTechnicalContext()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New support ticket</DialogTitle>
            <DialogDescription>
              Pick a project and optional product. Product also drives filters and technical
              linking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="support-new-title">Title</Label>
              <Input
                id="support-new-title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Short description of the issue"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-new-project">Project</Label>
              <select
                id="support-new-project"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={createProjectId}
                onChange={(e) => setCreateProjectId(e.target.value)}
              >
                <option value="">Select project</option>
                {projectsForFilters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-new-product">Product (optional)</Label>
              <select
                id="support-new-product"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={createProductId}
                onChange={(e) => setCreateProductId(e.target.value)}
                disabled={!createProjectId}
              >
                <option value="">None</option>
                {createProductOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="support-new-category">Category</Label>
                <select
                  id="support-new-category"
                  className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                >
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="support-new-priority">Priority</Label>
                <select
                  id="support-new-priority"
                  className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value)}
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-new-desc">Description (optional)</Label>
              <Textarea
                id="support-new-desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={3}
                className="resize-y"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-new-coverage">Coverage (optional)</Label>
              <select
                id="support-new-coverage"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={createCoverageDecision}
                onChange={(e) => setCreateCoverageDecision(e.target.value)}
              >
                <option value="">Decide later</option>
                {TICKET_COVERAGE_DECISIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-new-contact">Contact (optional)</Label>
              <select
                id="support-new-contact"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={createContactId}
                onChange={(e) => setCreateContactId(e.target.value)}
              >
                <option value="">None</option>
                {createContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionId === 'create-ticket'}
              onClick={() => void submitCreateTicket()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!statusDialog && statusDialog.mode === 'RESOLVED'}
        onOpenChange={(open) => {
          if (!open) setStatusDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark resolved</DialogTitle>
            <DialogDescription>
              Resolution summary is required ({MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH}+ characters).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="support-resolve-summary">Resolution summary</Label>
            <Textarea
              id="support-resolve-summary"
              value={statusResolutionDraft}
              onChange={(e) => setStatusResolutionDraft(e.target.value)}
              rows={4}
              className="resize-y"
              placeholder="What was done, verification, client communication…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setStatusDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!!actionId?.startsWith('status:')}
              onClick={() => void submitResolveDialog()}
            >
              Save resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!statusDialog && statusDialog.mode === 'CLOSED'}
        onOpenChange={(open) => {
          if (!open) setStatusDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close ticket</DialogTitle>
            <DialogDescription>
              Record why the case left the active queue (audit). Default is client confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="support-close-reason">Close reason</Label>
            <select
              id="support-close-reason"
              className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
              value={statusCloseReason}
              onChange={(e) => setStatusCloseReason(e.target.value)}
            >
              {SUPPORT_TICKET_CLOSE_REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setStatusDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!!actionId?.startsWith('status:')}
              onClick={() => void submitCloseDialog()}
            >
              Close ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupportTicketDetailSheet
        ticketId={detailTicketId}
        open={detailOpen}
        onOpenChange={handleSupportDetailOpenChange}
        refreshKey={detailRefreshKey}
        meId={me?.id ?? null}
        onListInvalidate={() => void refreshSupportViews()}
        onRequestResolve={(t) => {
          setStatusResolutionDraft(t.resolutionSummary ?? '');
          setStatusDialog({ ticket: t, mode: 'RESOLVED' });
        }}
        onRequestClose={(t) => {
          if (t.status !== 'RESOLVED') {
            setError(
              'Move the ticket to Resolved before Closed (extension delivery may close it automatically).',
            );
            return;
          }
          setStatusCloseReason('CLIENT_CONFIRMED');
          setStatusDialog({ ticket: t, mode: 'CLOSED' });
        }}
        onRequestEscalate={(t) => {
          setEscalateTicket(t);
          setEscalateReason(t.waitingReason ?? '');
        }}
        onRequestTechnical={(t) => {
          setTechnicalTicket(t);
        }}
      />
    </div>
  );
}

function SupportChangeControlAction({
  ticket,
  busy,
  disabled,
  onCreateDeal,
}: {
  ticket: SupportTicket;
  busy: boolean;
  disabled: boolean;
  onCreateDeal: (ticket: SupportTicket) => Promise<void>;
}) {
  if (ticket.category !== 'CHANGE_REQUEST') return null;

  if (ticket.extensionDeal) {
    return (
      <StatusBadge
        label={`Deal ${ticket.extensionDeal.code}`}
        variant={ticket.extensionDeal.status === 'WON' ? 'green' : 'purple'}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={
        disabled || busy || !ticket.productId || ['RESOLVED', 'CLOSED'].includes(ticket.status)
      }
      onClick={() => void onCreateDeal(ticket)}
      className="h-7 gap-1 px-2 text-xs"
      title={ticket.productId ? 'Create Extension Deal' : 'Product context is required'}
    >
      <FilePlus2 size={12} />
      Extension deal
    </Button>
  );
}
