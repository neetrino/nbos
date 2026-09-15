import type { ReactNode } from 'react';
import { Building2, FolderKanban, type LucideIcon } from 'lucide-react';
import {
  formatEntityListDate,
  resolveEntityCardDateParts,
} from '@/components/shared/entity-list-date';
import { cn } from '@/lib/utils';

const CARD_DATE_CLASS = {
  dayMonth: 'text-base leading-none font-bold tabular-nums',
  year: 'mt-0.5 text-[10px] leading-tight',
  due: 'text-orange-500 dark:text-orange-400',
  dueYear: 'text-orange-500/70 dark:text-orange-400/70',
  overdue: 'text-red-600 dark:text-red-400',
  overdueYear: 'text-red-600/70 dark:text-red-400/70',
} as const;

const INVOICE_CARD_RELATION_VISUAL: Record<
  'company' | 'project',
  { icon: LucideIcon; iconClassName: string }
> = {
  company: {
    icon: Building2,
    iconClassName: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
  },
  project: {
    icon: FolderKanban,
    iconClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
  },
};

export function InvoiceKanbanCardMeta({
  companyName,
  projectName,
  dueDate,
  overdue,
  overdueLabel,
}: {
  companyName?: string;
  projectName?: string;
  dueDate?: string | null;
  overdue: boolean;
  overdueLabel: string;
}) {
  const relation = resolveInvoiceCardRelation(companyName, projectName);

  return (
    <div
      className={cn(
        'border-border flex gap-3 border-t pt-2',
        relation ? 'items-center justify-between' : 'justify-end',
      )}
    >
      {relation ? (
        <div className="min-w-0 flex-1">
          <InvoiceCardRelationRow relation={relation} />
        </div>
      ) : null}
      {dueDate ? (
        <InvoiceCardDueDate value={dueDate} overdue={overdue} overdueLabel={overdueLabel} />
      ) : null}
    </div>
  );
}

type InvoiceCardRelation = { kind: 'company' | 'project'; label: string };

function resolveInvoiceCardRelation(
  companyName?: string,
  projectName?: string,
): InvoiceCardRelation | null {
  if (companyName) return { kind: 'company', label: companyName };
  if (projectName) return { kind: 'project', label: projectName };
  return null;
}

function InvoiceCardRelationRow({ relation }: { relation: InvoiceCardRelation }) {
  const visual = INVOICE_CARD_RELATION_VISUAL[relation.kind];
  const Icon = visual.icon;
  return (
    <MetaRow
      icon={<Icon size={14} aria-hidden />}
      iconClassName={visual.iconClassName}
      label={relation.label}
    />
  );
}

function InvoiceCardDueDate({
  value,
  overdue,
  overdueLabel,
}: {
  value: string;
  overdue: boolean;
  overdueLabel: string;
}) {
  const parts = resolveEntityCardDateParts(value);
  if (!parts) return null;

  const formatted = formatEntityListDate(value) || parts.dayMonth;
  const label = overdue ? `${formatted} ${overdueLabel}` : formatted;

  return (
    <time dateTime={value} aria-label={label} className="shrink-0 text-right">
      <p
        className={cn(
          CARD_DATE_CLASS.dayMonth,
          overdue ? CARD_DATE_CLASS.overdue : CARD_DATE_CLASS.due,
        )}
      >
        {parts.dayMonth}
      </p>
      <p
        className={cn(
          CARD_DATE_CLASS.year,
          overdue ? CARD_DATE_CLASS.overdueYear : CARD_DATE_CLASS.dueYear,
        )}
      >
        {parts.year}
      </p>
    </time>
  );
}

function MetaRow({
  icon,
  iconClassName,
  label,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2.5">
      <span
        className={cn(
          'flex size-7 items-center justify-center justify-self-start rounded-lg',
          iconClassName,
        )}
      >
        {icon}
      </span>
      <p className="text-foreground/80 truncate text-xs">{label}</p>
    </div>
  );
}
