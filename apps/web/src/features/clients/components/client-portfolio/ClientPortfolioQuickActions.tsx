'use client';

import Link from 'next/link';
import { FileText, Handshake, Headphones, MessageCircle, Receipt } from 'lucide-react';
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
}

export function ClientPortfolioQuickActions({
  variant,
  entityId,
  data,
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

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        <div className="bg-muted h-8 w-24 animate-pulse rounded-md" />
        <div className="bg-muted h-8 w-28 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canDeal && dealHref ? (
        <Link
          href={dealHref}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex gap-1.5')}
        >
          <Handshake size={14} aria-hidden />
          New deal
        </Link>
      ) : canDeal ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="gap-1.5"
          title="Set a primary contact on the company to start a deal from here."
        >
          <Handshake size={14} aria-hidden />
          New deal
        </Button>
      ) : null}

      {canInvoice && invoiceHref ? (
        <Link
          href={invoiceHref}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex gap-1.5')}
        >
          <Receipt size={14} aria-hidden />
          Create invoice
        </Link>
      ) : canInvoice ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="gap-1.5"
          title="No project in this portfolio slice; open a project first or create a deal."
        >
          <Receipt size={14} aria-hidden />
          Create invoice
        </Button>
      ) : null}

      {canTicket && ticketHref ? (
        <Link
          href={ticketHref}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex gap-1.5')}
        >
          <Headphones size={14} aria-hidden />
          New ticket
        </Link>
      ) : canTicket ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="gap-1.5"
          title="No project in this portfolio slice."
        >
          <Headphones size={14} aria-hidden />
          New ticket
        </Button>
      ) : null}

      {canMessenger ? (
        <Link
          href={PORTFOLIO_MESSENGER_HREF}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex gap-1.5')}
        >
          <MessageCircle size={14} aria-hidden />
          Open messenger
        </Link>
      ) : null}

      {canDrive ? (
        <Link
          href={PORTFOLIO_DRIVE_HREF}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex gap-1.5')}
        >
          <FileText size={14} aria-hidden />
          Open drive
        </Link>
      ) : null}
    </div>
  );
}
