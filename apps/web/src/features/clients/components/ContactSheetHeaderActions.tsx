'use client';

import { useState } from 'react';
import { GitMerge, RotateCcw, Trash2 } from 'lucide-react';
import { canOfferContactMerge } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';
import type { Contact } from '@/lib/api/clients';
import type { ContactPortfolioResponse } from '@/lib/api/client-portfolio';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { usePermission } from '@/lib/permissions';
import { ClientPortfolioQuickActionsHeader } from './client-portfolio/ClientPortfolioQuickActions';
import { ClickToCallButton, ClickToCallMenuItems } from '@/features/crm/calls/ClickToCallButton';
import {
  canShowClickToCallButton,
  hasClickToCallPermission,
} from '@/features/crm/calls/click-to-call-status';
import { ContactMergeDialog } from './ContactMergeDialog';
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
  const isMobileViewport = useIsMobileViewport();
  const { me, can } = usePermission();
  const [mergeOpen, setMergeOpen] = useState(false);
  const canMerge =
    Boolean(onMerged) &&
    !isTrashView &&
    canOfferContactMerge(me?.role.slug, me?.isPlatformOwner === true);
  const canCall = canShowClickToCallButton({
    hidden: isTrashView,
    canCreate: hasClickToCallPermission(can, 'CONTACT'),
  });
  const showMobileOverflow =
    isMobileViewport && !isTrashView && (canCall || Boolean(onRemoveParticipant) || canMerge);
  const showActiveSettings = Boolean(onMoveToTrash) || showMobileOverflow;

  return (
    <div className="flex h-9 shrink-0 items-center gap-1.5">
      {!isMobileViewport ? (
        <>
          <ClickToCallButton targetType="CONTACT" targetId={contact.id} hidden={isTrashView} />
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
          {canMerge ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setMergeOpen(true)}>
              <GitMerge size={14} className="mr-1" />
              Merge
            </Button>
          ) : null}
        </>
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
      ) : showActiveSettings ? (
        <DetailSheetSettingsMenu>
          {isMobileViewport ? (
            <>
              <ClickToCallMenuItems
                targetType="CONTACT"
                targetId={contact.id}
                hidden={isTrashView}
              />
              {onRemoveParticipant ? (
                <DropdownMenuItem
                  variant="destructive"
                  disabled={removingFromProject || saving}
                  onClick={onRequestRemoveFromProject}
                >
                  <Trash2 />
                  Remove
                </DropdownMenuItem>
              ) : null}
              {canMerge ? (
                <DropdownMenuItem onClick={() => setMergeOpen(true)}>
                  <GitMerge />
                  Merge
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
          {onMoveToTrash ? (
            <DropdownMenuItem variant="destructive" onClick={() => onMoveToTrash(contact.id)}>
              <Trash2 />
              Move to Trash
            </DropdownMenuItem>
          ) : null}
        </DetailSheetSettingsMenu>
      ) : null}
      {canMerge && onMerged ? (
        <ContactMergeDialog
          open={mergeOpen}
          currentContact={contact}
          onOpenChange={setMergeOpen}
          onMerged={onMerged}
        />
      ) : null}
    </div>
  );
}
