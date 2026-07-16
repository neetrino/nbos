'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet } from '@/components/ui/sheet';
import {
  DeleteConfirmDialog,
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  EntityDetailSheetLoadingShell,
  StatusBadge,
} from '@/components/shared';
import { getContactRole } from '../constants/clients';
import type { Contact } from '@/lib/api/clients';
import {
  buildContactGeneralPatch,
  createContactGeneralDraft,
  isContactGeneralDirty,
  type ContactGeneralDraft,
} from './contact-general-form-state';
import { ContactSheetScrollBody } from './ContactSheetScrollBody';
import {
  CONTACT_SHEET_BODY_SCROLL_CLASS,
  CONTACT_SHEET_CONTENT_WIDTH_CLASS,
  CONTACT_SHEET_RAIL_ANCHOR_CLASS,
} from './contact-sheet-layout';
import {
  ClientDetailTabBar,
  ClientPortfolioPanel,
  useClientPortfolioData,
} from './client-portfolio/ClientPortfolioEmbedded';
import { ClientPortfolioQuickActionsHeader } from './client-portfolio/ClientPortfolioQuickActions';
import type {
  ClientDetailTabId,
  ClientEmbeddedPortfolioTabId,
} from './client-portfolio/client-portfolio-tabs';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

interface ContactSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  isTrashView?: boolean;
  onMoveToTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  forceNestedBackdrop?: boolean;
  /** Project About: Remove contact from this project. */
  onRemoveParticipant?: () => void | Promise<void>;
}

function contactSaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export function ContactSheet({
  contact,
  open,
  onOpenChange,
  onUpdate,
  isTrashView = false,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  forceNestedBackdrop = false,
  onRemoveParticipant,
}: ContactSheetProps) {
  const { persistedValue: renderContact, onOpenChangeComplete } = useSheetPersistedValue(contact);
  const hostMounted = useSheetHostMounted(open, renderContact);

  const [draft, setDraft] = useState<ContactGeneralDraft | null>(null);
  const [snap, setSnap] = useState<ContactGeneralDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [removeFromProjectOpen, setRemoveFromProjectOpen] = useState(false);
  const [removingFromProject, setRemovingFromProject] = useState(false);
  const [activeTab, setActiveTab] = useState<ClientDetailTabId>('general');
  const portfolio = useClientPortfolioData({
    variant: 'contact',
    entityId: contact?.id ?? null,
  });

  useLayoutEffect(() => {
    if (!contact) {
      setDraft(null);
      setSnap(null);
      return;
    }
    const next = createContactGeneralDraft(contact);
    setDraft(next);
    setSnap(next);
  }, [contact]);

  useEffect(() => {
    if (!open) {
      setGeneralError(null);
      setRemoveFromProjectOpen(false);
      setRemovingFromProject(false);
    }
  }, [open]);

  useEffect(() => {
    setActiveTab('general');
  }, [contact?.id]);

  useEffect(() => {
    const allowedTabs = new Set(portfolio.tabs.map((tab) => tab.id));
    if (!allowedTabs.has(activeTab)) setActiveTab('general');
  }, [activeTab, portfolio.tabs]);

  const patchDraft = useCallback((partial: Partial<ContactGeneralDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty = draft != null && snap != null && isContactGeneralDirty(draft, snap);

  const handleGeneralSave = useCallback(async () => {
    if (!contact || !draft || !snap) return;
    setGeneralError(null);
    const patch = buildContactGeneralPatch(snap, draft);
    if (Object.keys(patch).length === 0) return;
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setGeneralError('First and last name are required.');
      return;
    }
    if (!draft.phone.trim()) {
      setGeneralError('Phone is required.');
      return;
    }
    setSaving(true);
    try {
      await onUpdate(contact.id, patch);
    } catch (err) {
      setGeneralError(contactSaveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [contact, draft, snap, onUpdate]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (snap) setDraft({ ...snap });
  }, [snap]);

  const handleRemoveFromProject = useCallback(async () => {
    if (!onRemoveParticipant) return;
    setRemovingFromProject(true);
    try {
      await onRemoveParticipant();
      setRemoveFromProjectOpen(false);
      onOpenChange(false);
    } catch {
      // Caller surfaces errors; keep sheet open for retry.
    } finally {
      setRemovingFromProject(false);
    }
  }, [onOpenChange, onRemoveParticipant]);

  if (!hostMounted) return null;

  if (!renderContact || !draft || !snap) {
    return (
      <EntityDetailSheetLoadingShell
        open={open}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
        label="Loading contact…"
        contentClassName={CONTACT_SHEET_CONTENT_WIDTH_CLASS}
        railAnchorClassName={CONTACT_SHEET_RAIL_ANCHOR_CLASS}
        forceNestedBackdrop={forceNestedBackdrop}
      />
    );
  }

  const role = getContactRole(draft.role);
  const displayTitle =
    `${draft.firstName} ${draft.lastName}`.trim() ||
    `${renderContact.firstName} ${renderContact.lastName}`;

  const sourcePageHref = `/clients/contacts?openId=${encodeURIComponent(renderContact.id)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        contentClassName={CONTACT_SHEET_CONTENT_WIDTH_CLASS}
        railAnchorClassName={CONTACT_SHEET_RAIL_ANCHOR_CLASS}
        sourcePageHref={sourcePageHref}
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <div className="bg-background shrink-0 px-5 pt-5 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                  {displayTitle}
                </h2>
                {role ? (
                  <StatusBadge
                    label={role.label}
                    variant={role.variant}
                    className="shrink-0 self-center"
                  />
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {onRemoveParticipant ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  disabled={removingFromProject || saving}
                  onClick={() => setRemoveFromProjectOpen(true)}
                  aria-label="Remove contact from project"
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              ) : null}
              {!isTrashView ? (
                <ClientPortfolioQuickActionsHeader
                  variant="contact"
                  entityId={renderContact.id}
                  data={portfolio.data}
                  loading={portfolio.loading}
                />
              ) : null}
              {isTrashView && onRestore ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem onClick={() => onRestore(renderContact.id)}>
                    <RotateCcw />
                    Restore
                  </DropdownMenuItem>
                  {onPermanentDelete ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onPermanentDelete(renderContact.id)}
                    >
                      <Trash2 />
                      Delete permanently
                    </DropdownMenuItem>
                  ) : null}
                </DetailSheetSettingsMenu>
              ) : onMoveToTrash ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onMoveToTrash(renderContact.id)}
                  >
                    <Trash2 />
                    Move to Trash
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              ) : null}
            </div>
          </div>
        </div>

        <ClientDetailTabBar activeTab={activeTab} tabs={portfolio.tabs} onSelect={setActiveTab} />

        <div className={CONTACT_SHEET_BODY_SCROLL_CLASS}>
          <DetailSheetTabPanel tabKey={activeTab}>
            {activeTab === 'general' ? (
              <ContactSheetScrollBody
                contact={renderContact}
                draft={draft}
                patchDraft={patchDraft}
                saving={saving}
                readOnly={isTrashView}
                generalError={generalError}
                portfolioData={portfolio.data}
                portfolioLoading={portfolio.loading}
                portfolioError={portfolio.error}
                onPortfolioRetry={portfolio.reload}
              />
            ) : (
              <ClientPortfolioPanel
                tab={activeTab as ClientEmbeddedPortfolioTabId}
                data={portfolio.data}
                loading={portfolio.loading}
                error={portfolio.error}
                variant="contact"
                onRetry={portfolio.reload}
              />
            )}
          </DetailSheetTabPanel>
        </div>

        <DetailSheetFormFooter
          visible={!isTrashView && activeTab === 'general' && Boolean(draft)}
          dirty={generalDirty}
          saving={saving}
          errorMessage={generalError}
          onSave={() => void handleGeneralSave()}
          onCancel={handleGeneralCancel}
        />
      </EntityDetailSheetContent>

      {onRemoveParticipant ? (
        <DeleteConfirmDialog
          open={removeFromProjectOpen}
          onOpenChange={setRemoveFromProjectOpen}
          level="simple"
          itemName={displayTitle}
          title="Remove contact?"
          description="They will be unlinked from this project. You can add them again later."
          confirmLabel="Remove"
          isSubmitting={removingFromProject}
          forceNestedBackdrop
          onConfirm={() => void handleRemoveFromProject()}
        />
      ) : null}
    </Sheet>
  );
}
