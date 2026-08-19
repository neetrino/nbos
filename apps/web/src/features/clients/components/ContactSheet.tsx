'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import {
  DeleteConfirmDialog,
  DetailSheetFormFooter,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
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
import { ContactSheetHeaderActions } from './ContactSheetHeaderActions';
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
  onContactPatched?: (contact: Contact) => void;
  onMerged?: (survivor: Contact) => void;
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
  onContactPatched,
  onMerged,
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
    // Seed form when switching contacts only (not on list refresh of same id).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional key
  }, [contact?.id]);

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

  const activeDraft = draft ?? (renderContact ? createContactGeneralDraft(renderContact) : null);
  const activeSnap = snap ?? activeDraft;
  const generalDirty =
    activeDraft != null && activeSnap != null && isContactGeneralDirty(activeDraft, activeSnap);

  const handleGeneralSave = useCallback(async () => {
    if (!contact || !activeDraft || !activeSnap) return;
    setGeneralError(null);
    const patch = buildContactGeneralPatch(activeSnap, activeDraft);
    if (Object.keys(patch).length === 0) return;
    if (!activeDraft.firstName.trim() || !activeDraft.lastName.trim()) {
      setGeneralError('First and last name are required.');
      return;
    }
    if (!activeDraft.phone.trim()) {
      setGeneralError('Phone is required.');
      return;
    }
    setSaving(true);
    try {
      await onUpdate(contact.id, patch);
      setSnap(activeDraft);
      setDraft(activeDraft);
    } catch (err) {
      setGeneralError(contactSaveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [contact, activeDraft, activeSnap, onUpdate]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (activeSnap) setDraft({ ...activeSnap });
  }, [activeSnap]);

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

  const role = activeDraft ? getContactRole(activeDraft.role) : undefined;
  const displayTitle = activeDraft
    ? `${activeDraft.firstName} ${activeDraft.lastName}`.trim() ||
      (renderContact ? `${renderContact.firstName} ${renderContact.lastName}` : 'Contact')
    : renderContact
      ? `${renderContact.firstName} ${renderContact.lastName}`
      : 'Contact';
  const sourcePageHref = renderContact
    ? `/clients/contacts?openId=${encodeURIComponent(renderContact.id)}`
    : '/clients/contacts';

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        contentClassName={CONTACT_SHEET_CONTENT_WIDTH_CLASS}
        railAnchorClassName={CONTACT_SHEET_RAIL_ANCHOR_CLASS}
        sourcePageHref={sourcePageHref}
        forceNestedBackdrop={forceNestedBackdrop}
        showRailActions={Boolean(renderContact)}
      >
        <div className="flex h-full min-h-0 flex-col">
          {!renderContact || !activeDraft || !activeSnap ? (
            <div className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
              Loading contact…
            </div>
          ) : (
            <>
              <div className="bg-background shrink-0 px-5 pt-5 pb-3">
                <div className="flex min-h-9 min-w-0 flex-nowrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex max-w-full min-w-0 flex-nowrap items-center gap-2">
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
                  <ContactSheetHeaderActions
                    contact={renderContact}
                    isTrashView={isTrashView}
                    saving={saving}
                    removingFromProject={removingFromProject}
                    portfolioData={portfolio.data}
                    portfolioLoading={portfolio.loading}
                    onRemoveParticipant={onRemoveParticipant}
                    onMerged={onMerged}
                    onRestore={onRestore}
                    onPermanentDelete={onPermanentDelete}
                    onMoveToTrash={onMoveToTrash}
                    onRequestRemoveFromProject={() => setRemoveFromProjectOpen(true)}
                  />
                </div>
              </div>

              <ClientDetailTabBar
                activeTab={activeTab}
                tabs={portfolio.tabs}
                onSelect={setActiveTab}
              />

              <div className={CONTACT_SHEET_BODY_SCROLL_CLASS}>
                <DetailSheetTabPanel tabKey={activeTab}>
                  {activeTab === 'general' ? (
                    <ContactSheetScrollBody
                      contact={renderContact}
                      draft={activeDraft}
                      patchDraft={patchDraft}
                      saving={saving}
                      readOnly={isTrashView}
                      generalError={generalError}
                      portfolioData={portfolio.data}
                      portfolioLoading={portfolio.loading}
                      portfolioError={portfolio.error}
                      onPortfolioRetry={portfolio.reload}
                      onContactPatched={onContactPatched}
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
                visible={!isTrashView && activeTab === 'general'}
                dirty={generalDirty}
                saving={saving}
                errorMessage={generalError}
                onSave={() => void handleGeneralSave()}
                onCancel={handleGeneralCancel}
              />
            </>
          )}
        </div>
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
