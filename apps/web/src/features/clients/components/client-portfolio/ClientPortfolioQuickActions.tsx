'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  FileText,
  Handshake,
  Headphones,
  Loader2,
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
import type { FileAsset } from '@/lib/api/drive';
import { toast } from 'sonner';
import {
  ClientPortfolioQuickActionDialogs,
  type PortfolioQuickActionOverlay,
} from './client-portfolio-quick-action-dialogs';
import {
  loadLatestPortfolioDriveFile,
  portfolioDriveLoadErrorMessage,
} from './portfolio-drive-file.util';

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

const QUICK_ACTION_BUTTON_HOVER_CLASS =
  'transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.08] motion-reduce:transition-none motion-reduce:hover:translate-y-0 active:translate-y-0';

export function ClientPortfolioQuickActions({
  variant,
  entityId,
  data,
}: ClientPortfolioQuickActionsProps) {
  const { can, isLoading } = usePermission();
  const [openDialog, setOpenDialog] = useState<PortfolioQuickActionOverlay | null>(null);
  const [driveFile, setDriveFile] = useState<FileAsset | null>(null);
  const [driveOpening, setDriveOpening] = useState(false);
  const mask = data.accessMask;
  const projectId = firstProjectId(data);
  const dealContactId = primaryContactIdForDeal(variant, entityId, data);

  const handleOpenDrive = useCallback(async () => {
    setDriveOpening(true);
    try {
      const latest = await loadLatestPortfolioDriveFile({ variant, entityId });
      if (!latest) {
        toast.error('No files linked yet.');
        return;
      }
      setDriveFile(latest);
      setOpenDialog('drive');
    } catch (err) {
      toast.error(portfolioDriveLoadErrorMessage(err));
    } finally {
      setDriveOpening(false);
    }
  }, [variant, entityId]);

  const handleOpenDialogChange = useCallback((dialog: PortfolioQuickActionOverlay | null) => {
    setOpenDialog(dialog);
    if (dialog !== 'drive') setDriveFile(null);
  }, []);

  const actions = useMemo(() => {
    const items: QuickActionItem[] = [];
    if (can('ADD', 'CRM_DEALS')) {
      items.push({
        id: 'new-deal',
        label: 'New deal',
        icon: Handshake,
        enabled: Boolean(dealContactId),
        disabledTitle: 'Set a primary contact on the company to start a deal from here.',
        onClick: () => setOpenDialog('deal'),
      });
    }
    if (can('ADD', 'FINANCE_INVOICES') && mask.finance) {
      items.push({
        id: 'create-invoice',
        label: 'Create invoice',
        icon: Receipt,
        enabled: Boolean(projectId),
        disabledTitle: 'No project in this portfolio slice; open a project first or create a deal.',
        onClick: () => setOpenDialog('invoice'),
      });
    }
    if (can('ADD', 'SUPPORT_TICKETS') && mask.support) {
      items.push({
        id: 'new-ticket',
        label: 'New ticket',
        icon: Headphones,
        enabled: Boolean(projectId),
        disabledTitle: 'No project in this portfolio slice.',
        onClick: () => setOpenDialog('ticket'),
      });
    }
    if (can('VIEW', 'MESSENGER') && mask.communication) {
      items.push({
        id: 'open-messenger',
        label: 'Open messenger',
        icon: MessageCircle,
        enabled: true,
        onClick: () => setOpenDialog('messenger'),
      });
    }
    if (can('VIEW', 'DRIVE') && mask.files) {
      items.push({
        id: 'open-drive',
        label: 'Open drive',
        icon: FileText,
        enabled: !driveOpening,
        loading: driveOpening,
        onClick: () => void handleOpenDrive(),
      });
    }
    return items;
  }, [
    can,
    dealContactId,
    driveOpening,
    handleOpenDrive,
    mask.communication,
    mask.files,
    mask.finance,
    mask.support,
    projectId,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-nowrap gap-2">
        <div className="bg-muted h-8 w-24 shrink-0 animate-pulse rounded-md" />
        <div className="bg-muted h-8 w-28 shrink-0 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-nowrap gap-2">
        {actions.map((action) => (
          <QuickAction key={action.id} action={action} />
        ))}
      </div>

      <ClientPortfolioQuickActionDialogs
        openDialog={openDialog}
        onOpenDialogChange={handleOpenDialogChange}
        dealContactId={dealContactId}
        projectId={projectId}
        driveFile={driveFile}
      />
    </>
  );
}

interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  loading?: boolean;
  onClick?: () => void;
  disabledTitle?: string;
}

function QuickAction({ action }: { action: QuickActionItem }) {
  const Icon = action.icon;
  const interactiveClass = cn(
    buttonVariants({ variant: 'outline', size: 'sm' }),
    'inline-flex shrink-0 gap-1.5 whitespace-nowrap',
    QUICK_ACTION_BUTTON_HOVER_CLASS,
  );

  if (action.onClick && action.enabled) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={interactiveClass}
        onClick={action.onClick}
        disabled={action.loading}
      >
        {action.loading ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : (
          <Icon size={14} aria-hidden />
        )}
        {action.label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled
      className="shrink-0 gap-1.5 whitespace-nowrap"
      title={action.disabledTitle}
    >
      <Icon size={14} aria-hidden />
      {action.label}
    </Button>
  );
}
