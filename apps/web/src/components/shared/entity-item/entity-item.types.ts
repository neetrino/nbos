import type { LucideIcon } from 'lucide-react';
import type { StatusVariant } from '../StatusBadge';
import type { BonusEntryListRow } from '@/lib/api/bonus';
import type { Expense, Invoice } from '@/lib/api/finance';
import type { Task } from '@/lib/api/tasks';

/** Supported related-entity kinds for tab preview + stacked sheet open. */
export type EntityItemKind = 'task' | 'invoice' | 'bonus_entry' | 'expense';

export type EntityItemVariant = 'list-row' | 'compact-card';

export type EntityItemStatus = {
  label: string;
  variant: StatusVariant;
};

export type EntityItemMetaChip = {
  icon?: LucideIcon;
  text: string;
};

/** Normalized preview model for {@link EntityItemSurface} across entity tabs. */
export type EntityItemSummary = {
  id: string;
  kind: EntityItemKind;
  title: string;
  subtitle?: string;
  status?: EntityItemStatus;
  /** Primary value (amount, deadline label, etc.). */
  primaryMetric?: string;
  /** Secondary trailing text (date, code). */
  trailing?: string;
  meta?: EntityItemMetaChip[];
  leadingIcon?: LucideIcon;
};

export type EntityItemOpenTarget = Pick<EntityItemSummary, 'id' | 'kind'> & {
  /** Optional list-row seed — sheet opens instantly without awaiting fetch. */
  task?: Task;
  expense?: Expense;
  invoice?: Invoice;
  entry?: BonusEntryListRow;
};
