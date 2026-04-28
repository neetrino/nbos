'use client';

import { Check, CircleDashed, ClipboardCheck, KeyRound, Package, RefreshCw } from 'lucide-react';
import type {
  FullProject,
  ProjectIntakeSummary,
  ProjectKickoffChecklistItem,
  UpdateKickoffChecklistItemInput,
} from '@/lib/api/projects';
import { ProjectKickoffChecklist } from './ProjectKickoffChecklist';

interface ProjectIntakePanelProps {
  project: FullProject;
  onKickoffChecklistItemUpdate: (
    itemId: string,
    data: UpdateKickoffChecklistItemInput,
  ) => Promise<ProjectKickoffChecklistItem>;
}

interface IntakeRow {
  label: string;
  ready: boolean;
  hint: string;
}

export function ProjectIntakePanel({
  project,
  onKickoffChecklistItemUpdate,
}: ProjectIntakePanelProps) {
  const intake = project.intake ?? getFallbackIntake(project);
  const rows = getIntakeRows(intake);

  return (
    <section className="rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/80 to-white p-5 dark:border-sky-800 dark:from-sky-950/20 dark:to-transparent">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardCheck className="size-4 text-sky-600 dark:text-sky-400" />
            PM Intake
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Read-only handoff context from CRM, Projects, and Finance data.
          </p>
        </div>
        <IntakeScore rows={rows} />
      </div>

      {intake.primaryProduct && (
        <div className="mb-4 rounded-lg border border-sky-100 bg-white/70 p-3 dark:border-sky-900/40 dark:bg-stone-900/20">
          <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-widest uppercase">
            Primary Product
          </p>
          <p className="text-sm font-semibold">{intake.primaryProduct.name}</p>
          <p className="text-muted-foreground text-xs">
            {intake.primaryProduct.status.replace(/_/g, ' ')}
          </p>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <ReadinessRow key={row.label} row={row} />
        ))}
      </div>

      <div className="text-muted-foreground mt-4 grid gap-2 text-xs md:grid-cols-4">
        <IntakeMetric icon={Package} label="Products" value={String(intake.productCount)} />
        <IntakeMetric icon={RefreshCw} label="Subscriptions" value={getSubscriptionLabel(intake)} />
        <IntakeMetric icon={KeyRound} label="Credentials" value={String(intake.credentialCount)} />
        <IntakeMetric
          icon={ClipboardCheck}
          label="Open Tasks"
          value={String(intake.openTaskCount)}
        />
      </div>

      <ProjectKickoffChecklist
        items={project.kickoffChecklist ?? []}
        onUpdate={onKickoffChecklistItemUpdate}
      />
    </section>
  );
}

function IntakeScore({ rows }: { rows: IntakeRow[] }) {
  const readyCount = rows.filter((row) => row.ready).length;
  return (
    <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
      {readyCount}/{rows.length} ready
    </div>
  );
}

function ReadinessRow({ row }: { row: IntakeRow }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-stone-100 bg-white/60 p-3 dark:border-stone-800 dark:bg-stone-900/20">
      {row.ready ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CircleDashed className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-foreground text-xs font-semibold">{row.label}</p>
        {!row.ready && <p className="text-muted-foreground text-[11px] leading-snug">{row.hint}</p>}
      </div>
    </div>
  );
}

function IntakeMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-100 bg-white/50 px-3 py-2 dark:border-stone-800 dark:bg-stone-900/20">
      <Icon className="size-3.5 shrink-0" />
      <span>{label}</span>
      <span className="text-foreground ml-auto font-semibold">{value}</span>
    </div>
  );
}

function getIntakeRows(intake: ProjectIntakeSummary): IntakeRow[] {
  return [
    { label: 'Product exists', ready: intake.hasProduct, hint: 'Create product from the project.' },
    {
      label: 'PM assigned',
      ready: intake.hasPm,
      hint: 'Assign PM on the product before delivery starts.',
    },
    {
      label: 'Deadline set',
      ready: intake.hasDeadline,
      hint: 'Set delivery deadline on the product.',
    },
    {
      label: 'Paid invoice',
      ready: intake.hasPaidInvoice,
      hint: 'Finance should confirm first payment.',
    },
    {
      label: 'Subscription context',
      ready: intake.hasSubscriptionContext,
      hint: 'No active or pending subscription linked yet.',
    },
    {
      label: 'Accesses present',
      ready: intake.hasCredentials,
      hint: 'Credentials can be added later.',
    },
  ];
}

function getSubscriptionLabel(intake: ProjectIntakeSummary) {
  if (intake.subscriptionStatuses.length === 0) return '0';
  return intake.subscriptionStatuses.join(', ').replace(/_/g, ' ');
}

function getFallbackIntake(project: FullProject): ProjectIntakeSummary {
  const primaryProduct = project.products[0] ?? null;
  return {
    primaryProduct: primaryProduct
      ? {
          id: primaryProduct.id,
          name: primaryProduct.name,
          status: primaryProduct.status,
          deadline: primaryProduct.deadline,
          pm: primaryProduct.pm,
        }
      : null,
    hasProduct: project.products.length > 0,
    hasPm: project.products.some((product) => Boolean(product.pm)),
    hasDeadline: project.products.some((product) => Boolean(product.deadline)),
    hasPaidInvoice: project.orders.some((order) =>
      order.invoices.some((invoice) => invoice.status === 'PAID' || Boolean(invoice.paidDate)),
    ),
    hasSubscriptionContext: project.subscriptions.length > 0,
    hasCredentials: project.credentials.length > 0,
    productCount: project.products.length,
    extensionCount: project.extensions.length,
    openTaskCount: getFallbackTaskCount(project),
    credentialCount: project.credentials.length,
    subscriptionStatuses: project.subscriptions.map((subscription) => subscription.status),
  };
}

function getFallbackTaskCount(project: FullProject) {
  const productTasks = project.products.reduce((sum, product) => sum + product._count.tasks, 0);
  const extensionTasks = project.extensions.reduce(
    (sum, extension) => sum + extension._count.tasks,
    0,
  );
  return productTasks + extensionTasks;
}
