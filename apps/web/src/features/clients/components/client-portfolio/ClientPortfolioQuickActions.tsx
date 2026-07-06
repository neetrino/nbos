'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ChevronDown,
  FileText,
  Handshake,
  Headphones,
  Loader2,
  MessageCircle,
  Receipt,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
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

interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  onClick?: () => void;
  disabledTitle?: string;
}

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
        disabledTitle: driveOpening ? 'Loading file…' : undefined,
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
    return <QuickActionsTriggerSkeleton />;
  }

  if (actions.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={driveOpening}
            >
              {driveOpening ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : (
                <Zap size={14} aria-hidden />
              )}
              Quick actions
              <ChevronDown size={14} className="opacity-60" aria-hidden />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" className="min-w-44">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.id}
                disabled={!action.enabled}
                title={action.disabledTitle}
                onClick={() => action.onClick?.()}
              >
                <Icon />
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

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

export function ClientPortfolioQuickActionsHeader({
  variant,
  entityId,
  data,
  loading,
}: {
  variant: 'contact' | 'company';
  entityId: string;
  data: ContactPortfolioResponse | CompanyPortfolioResponse | null;
  loading: boolean;
}) {
  if (loading) return <QuickActionsTriggerSkeleton />;
  if (!data) return null;
  return <ClientPortfolioQuickActions variant={variant} entityId={entityId} data={data} />;
}

function QuickActionsTriggerSkeleton() {
  return <Skeleton className="h-8 w-[7.5rem] shrink-0 rounded-md" />;
}
