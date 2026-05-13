'use client';

import Link from 'next/link';
import {
  FileText,
  Handshake,
  Headphones,
  MessageCircle,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/permissions';
import type {
  CompanyPortfolioResponse,
  ContactPortfolioResponse,
} from '@/lib/api/client-portfolio';
import {
  PORTFOLIO_DRIVE_HREF,
  PORTFOLIO_MESSENGER_HREF,
  buildPortfolioNewDealHref,
  buildPortfolioNewInvoiceHref,
  buildPortfolioNewTicketHref,
} from '../../constants/client-portfolio-deep-links';

function firstProjectId(data: ContactPortfolioResponse | CompanyPortfolioResponse): string | null {
  if (data.scope === 'contact') {
    const projects = (data.contact as { projects?: Array<{ id: string }> }).projects;
    return projects?.[0]?.id ?? null;
  }
  const projects = (data.company as { projects?: Array<{ id: string }> }).projects;
  return projects?.[0]?.id ?? null;
}

function primaryContactIdForDeal(
  variant: 'contact' | 'company',
  entityId: string,
  data: ContactPortfolioResponse | CompanyPortfolioResponse,
): string | null {
  if (variant === 'contact') return entityId;
  const c = (data as CompanyPortfolioResponse).company as { contact?: { id: string } | null };
  return c.contact?.id ?? null;
}

export interface ClientPortfolioQuickActionsProps {
  variant: 'contact' | 'company';
  entityId: string;
  data: ContactPortfolioResponse | CompanyPortfolioResponse;
  layout?: 'inline' | 'rail';
}

export function ClientPortfolioQuickActions({
  variant,
  entityId,
  data,
  layout = 'inline',
}: ClientPortfolioQuickActionsProps) {
  const { can, isLoading } = usePermission();
  const mask = data.accessMask;
  const projectId = firstProjectId(data);
  const dealContactId = primaryContactIdForDeal(variant, entityId, data);

  const canDeal = can('ADD', 'CRM_DEALS');
  const canInvoice = can('ADD', 'FINANCE_INVOICES') && mask.finance;
  const canTicket = can('ADD', 'SUPPORT_TICKETS') && mask.support;
  const canMessenger = can('VIEW', 'MESSENGER') && mask.communication;
  const canDrive = can('VIEW', 'DRIVE') && mask.files;

  const dealHref = dealContactId ? buildPortfolioNewDealHref(dealContactId) : null;
  const invoiceHref = projectId ? buildPortfolioNewInvoiceHref(projectId) : null;
  const ticketHref = projectId ? buildPortfolioNewTicketHref(projectId) : null;
  const actions = buildQuickActions({
    canDeal,
    canInvoice,
    canTicket,
    canMessenger,
    canDrive,
    dealHref,
    invoiceHref,
    ticketHref,
  });

  if (isLoading) {
    return (
      <div className={layout === 'rail' ? 'grid gap-2' : 'flex flex-wrap gap-2'}>
        <div className="bg-muted h-8 w-24 animate-pulse rounded-md" />
        <div className="bg-muted h-8 w-28 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className={layout === 'rail' ? 'grid gap-2' : 'flex flex-wrap gap-2'}>
      {actions.map((action) => (
        <QuickAction key={action.id} action={action} layout={layout} />
      ))}
    </div>
  );
}

interface BuildQuickActionsOptions {
  canDeal: boolean;
  canInvoice: boolean;
  canTicket: boolean;
  canMessenger: boolean;
  canDrive: boolean;
  dealHref: string | null;
  invoiceHref: string | null;
  ticketHref: string | null;
}

interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string | null;
  disabledTitle?: string;
}

function buildQuickActions(options: BuildQuickActionsOptions): QuickActionItem[] {
  const items: QuickActionItem[] = [];
  if (options.canDeal) {
    items.push({
      id: 'new-deal',
      label: 'New deal',
      icon: Handshake,
      href: options.dealHref,
      disabledTitle: 'Set a primary contact on the company to start a deal from here.',
    });
  }
  if (options.canInvoice) {
    items.push({
      id: 'create-invoice',
      label: 'Create invoice',
      icon: Receipt,
      href: options.invoiceHref,
      disabledTitle: 'No project in this portfolio slice; open a project first or create a deal.',
    });
  }
  if (options.canTicket) {
    items.push({
      id: 'new-ticket',
      label: 'New ticket',
      icon: Headphones,
      href: options.ticketHref,
      disabledTitle: 'No project in this portfolio slice.',
    });
  }
  if (options.canMessenger) {
    items.push({
      id: 'open-messenger',
      label: 'Open messenger',
      icon: MessageCircle,
      href: PORTFOLIO_MESSENGER_HREF,
    });
  }
  if (options.canDrive) {
    items.push({
      id: 'open-drive',
      label: 'Open drive',
      icon: FileText,
      href: PORTFOLIO_DRIVE_HREF,
    });
  }
  return items;
}

function QuickAction({ action, layout }: { action: QuickActionItem; layout: 'inline' | 'rail' }) {
  const Icon = action.icon;
  const className = cn(
    buttonVariants({ variant: 'outline', size: 'sm' }),
    'inline-flex gap-1.5',
    layout === 'rail' ? 'w-full justify-start' : null,
  );
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        <Icon size={14} aria-hidden />
        {action.label}
      </Link>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled
      className={cn('gap-1.5', layout === 'rail' ? 'w-full justify-start' : null)}
      title={action.disabledTitle}
    >
      <Icon size={14} aria-hidden />
      {action.label}
    </Button>
  );
}
