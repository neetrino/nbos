'use client';

import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';
import type { Contact } from '@/lib/api/clients';
import type { ContactPortfolioResponse } from '@/lib/api/client-portfolio';
import { ClientPortfolioQuickActionsHeader } from './client-portfolio/ClientPortfolioQuickActions';
import { ContactSheetMergeControls } from './ContactSheetMergeControls';
import { isContactRestoreBlocked } from './contact-merge-wizard';

interface ContactSheetHeaderActionsProps {
  contact: Contact;
  isTrashView: boolean;
  saving: boolean;
  removingFromProject: boolean;
  portfolioData: ContactPortfolioResponse | null;
  portfolioLoading: boolean;
  onRemoveParticipant?: () => void;
  onMerged?: (survivor: Contact) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  onRequestRemoveFromProject: () => void;
}

export function ContactSheetHeaderActions({
  contact,
  isTrashView,
  saving,
  removingFromProject,
  portfolioData,
  portfolioLoading,
  onRemoveParticipant,
  onMerged,
  onRestore,
  onPermanentDelete,
  onMoveToTrash,
  onRequestRemoveFromProject,
}: ContactSheetHeaderActionsProps) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1.5">
      {onRemoveParticipant ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive shrink-0"
          disabled={removingFromProject || saving}
          onClick={onRequestRemoveFromProject}
          aria-label="Remove contact from project"
        >
          <Trash2 className="size-4" />
          Remove
        </Button>
      ) : null}
      {onMerged ? (
        <ContactSheetMergeControls
          contact={contact}
          isTrashView={isTrashView}
          onMerged={onMerged}
        />
      ) : null}
      {!isTrashView ? (
        <ClientPortfolioQuickActionsHeader
          variant="contact"
          entityId={contact.id}
          data={portfolioData}
          loading={portfolioLoading}
        />
      ) : null}
      {isTrashView && onRestore ? (
        <DetailSheetSettingsMenu>
          <DropdownMenuItem
            disabled={isContactRestoreBlocked(contact)}
            onClick={() => {
              if (isContactRestoreBlocked(contact)) return;
              onRestore(contact.id);
            }}
          >
            <RotateCcw />
            {isContactRestoreBlocked(contact) ? 'Restore blocked (merged)' : 'Restore'}
          </DropdownMenuItem>
          {onPermanentDelete ? (
            <DropdownMenuItem variant="destructive" onClick={() => onPermanentDelete(contact.id)}>
              <Trash2 />
              Delete permanently
            </DropdownMenuItem>
          ) : null}
        </DetailSheetSettingsMenu>
      ) : onMoveToTrash ? (
        <DetailSheetSettingsMenu>
          <DropdownMenuItem variant="destructive" onClick={() => onMoveToTrash(contact.id)}>
            <Trash2 />
            Move to Trash
          </DropdownMenuItem>
        </DetailSheetSettingsMenu>
      ) : null}
    </div>
  );
}
