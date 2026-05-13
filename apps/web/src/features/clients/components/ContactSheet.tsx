'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { LayoutDashboard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  EntitySheetFloatingRail,
  StatusBadge,
  DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS,
} from '@/components/shared';
import { getContactRole } from '../constants/clients';
import type { Contact } from '@/lib/api/clients';
import { ClientPortfolioView } from './client-portfolio/ClientPortfolioView';
import {
  buildContactGeneralPatch,
  createContactGeneralDraft,
  isContactGeneralDirty,
  type ContactGeneralDraft,
} from './contact-general-form-state';
import { ContactSheetScrollBody } from './ContactSheetScrollBody';

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
  const [portfolioOpen, setPortfolioOpen] = useState(false);

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
      setPortfolioOpen(false);
      setGeneralError(null);
    }
  }, [open]);

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

  const portfolioRailButton = (
    <Button
      type="button"
      variant="default"
      size="icon"
      className="bg-primary text-primary-foreground hover:bg-primary/90 size-10 shrink-0 rounded-l-full rounded-r-none border-0 shadow-md max-sm:rounded-full"
      aria-label="Open client portfolio"
      onClick={() => setPortfolioOpen(true)}
    >
      <LayoutDashboard className="size-4" aria-hidden />
    </Button>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          floatingClose
          floatingRailVisible={open}
          floatingRailAnchorClassName={DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS}
          floatingRail={
            <EntitySheetFloatingRail
              sourcePageHref={sourcePageHref}
              trailing={portfolioRailButton}
            />
          }
          className={DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS}
        >
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPortfolioOpen(true)}
                >
                  <LayoutDashboard size={14} className="mr-1" />
                  Portfolio
                </Button>
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

          <ScrollArea className="min-h-0 flex-1">
            <ContactSheetScrollBody
              contact={contact}
              draft={draft}
              patchDraft={patchDraft}
              saving={saving}
              generalError={generalError}
            />
          </ScrollArea>

          <DetailSheetFormFooter
            visible={Boolean(draft)}
            dirty={generalDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={() => void handleGeneralSave()}
            onCancel={handleGeneralCancel}
          />
        </SheetContent>
      </Sheet>

      <ClientPortfolioView
        variant="contact"
        entityId={contact.id}
        asSheet
        sheetOpen={portfolioOpen}
        onSheetOpenChange={setPortfolioOpen}
        forceNestedBackdrop
        sheetCloseOnlyBack
      />
    </>
  );
}
