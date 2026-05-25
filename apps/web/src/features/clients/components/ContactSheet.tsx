'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
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
  ClientDetailTabBar,
  ClientPortfolioPanel,
  useClientPortfolioData,
} from './client-portfolio/ClientPortfolioEmbedded';
import type {
  ClientDetailTabId,
  ClientEmbeddedPortfolioTabId,
} from './client-portfolio/client-portfolio-tabs';

interface ContactSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string) => void;
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
  onDelete,
}: ContactSheetProps) {
  const [draft, setDraft] = useState<ContactGeneralDraft | null>(null);
  const [snap, setSnap] = useState<ContactGeneralDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
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

  if (!contact || !draft || !snap) return null;

  const role = getContactRole(draft.role);
  const displayTitle =
    `${draft.firstName} ${draft.lastName}`.trim() || `${contact.firstName} ${contact.lastName}`;

  const sourcePageHref = `/clients/contacts?openId=${encodeURIComponent(contact.id)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="full" sourcePageHref={sourcePageHref}>
        <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                {displayTitle}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {role ? <StatusBadge label={role.label} variant={role.variant} /> : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 pt-0.5">
              {onDelete ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(contact.id)}>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              ) : null}
            </div>
          </div>
        </div>

        <ClientDetailTabBar activeTab={activeTab} tabs={portfolio.tabs} onSelect={setActiveTab} />

        <ScrollArea className="min-h-0 flex-1">
          {activeTab === 'general' ? (
            <ContactSheetScrollBody
              contact={contact}
              draft={draft}
              patchDraft={patchDraft}
              saving={saving}
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
        </ScrollArea>

        <DetailSheetFormFooter
          visible={activeTab === 'general' && Boolean(draft)}
          dirty={generalDirty}
          saving={saving}
          errorMessage={generalError}
          onSave={() => void handleGeneralSave()}
          onCancel={handleGeneralCancel}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}
