'use client';

import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';
import type { Company } from '@/lib/api/clients';
import type { CompanyPortfolioResponse } from '@/lib/api/client-portfolio';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { ClientPortfolioQuickActionsHeader } from './client-portfolio/ClientPortfolioQuickActions';

interface CompanySheetHeaderActionsProps {
  company: Company;
  isTrashView: boolean;
  saving: boolean;
  removingFromProject: boolean;
  portfolioData: CompanyPortfolioResponse | null;
  portfolioLoading: boolean;
  onRemoveParticipant?: () => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  onRequestRemoveFromProject: () => void;
}

export function CompanySheetHeaderActions({
  company,
  isTrashView,
  saving,
  removingFromProject,
  portfolioData,
  portfolioLoading,
  onRemoveParticipant,
  onRestore,
  onPermanentDelete,
  onMoveToTrash,
  onRequestRemoveFromProject,
}: CompanySheetHeaderActionsProps) {
  const isMobileViewport = useIsMobileViewport();
  const showActiveSettings =
    Boolean(onMoveToTrash) || (isMobileViewport && Boolean(onRemoveParticipant));

  return (
    <div className="flex h-9 shrink-0 items-center gap-1.5">
      {!isMobileViewport && onRemoveParticipant ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive shrink-0"
          disabled={removingFromProject || saving}
          onClick={onRequestRemoveFromProject}
          aria-label="Remove company from project"
        >
          <Trash2 className="size-4" />
          Remove
        </Button>
      ) : null}
      {!isTrashView ? (
        <ClientPortfolioQuickActionsHeader
          variant="company"
          entityId={company.id}
          data={portfolioData}
          loading={portfolioLoading}
        />
      ) : null}
      {isTrashView && onRestore ? (
        <DetailSheetSettingsMenu>
          <DropdownMenuItem onClick={() => onRestore(company.id)}>
            <RotateCcw />
            Restore
          </DropdownMenuItem>
          {onPermanentDelete ? (
            <DropdownMenuItem variant="destructive" onClick={() => onPermanentDelete(company.id)}>
              <Trash2 />
              Delete permanently
            </DropdownMenuItem>
          ) : null}
        </DetailSheetSettingsMenu>
      ) : showActiveSettings ? (
        <DetailSheetSettingsMenu>
          {isMobileViewport && onRemoveParticipant ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={removingFromProject || saving}
              onClick={onRequestRemoveFromProject}
            >
              <Trash2 />
              Remove
            </DropdownMenuItem>
          ) : null}
          {onMoveToTrash ? (
            <DropdownMenuItem variant="destructive" onClick={() => onMoveToTrash(company.id)}>
              <Trash2 />
              Move to Trash
            </DropdownMenuItem>
          ) : null}
        </DetailSheetSettingsMenu>
      ) : null}
    </div>
  );
}
