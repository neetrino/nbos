'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { getCompanyType, getTaxStatus } from '../constants/clients';
import { useContactSearchOptions } from '../hooks/use-contact-search-options';
import type { Company } from '@/lib/api/clients';
import { ClientPortfolioView } from './client-portfolio/ClientPortfolioView';
import {
  buildCompanyGeneralPatch,
  createCompanyGeneralDraft,
  isCompanyGeneralDirty,
  type CompanyGeneralDraft,
} from './company-general-form-state';
import { CompanySheetScrollBody } from './CompanySheetScrollBody';

interface CompanySheetProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string) => void;
}

function companySaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export function CompanySheet({
  company,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: CompanySheetProps) {
  const searchContacts = useContactSearchOptions();
  const [draft, setDraft] = useState<CompanyGeneralDraft | null>(null);
  const [snap, setSnap] = useState<CompanyGeneralDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!company) {
      setDraft(null);
      setSnap(null);
      return;
    }
    const next = createCompanyGeneralDraft(company);
    setDraft(next);
    setSnap(next);
  }, [company]);

  useEffect(() => {
    if (!open) {
      setPortfolioOpen(false);
      setEditingName(false);
      setGeneralError(null);
    }
  }, [open]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    setEditingName(false);
  }, [company?.id]);

  const patchDraft = useCallback((partial: Partial<CompanyGeneralDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty = draft != null && snap != null && isCompanyGeneralDirty(draft, snap);

  const handleGeneralSave = useCallback(async () => {
    if (!company || !draft || !snap) return;
    setGeneralError(null);
    const patch = buildCompanyGeneralPatch(snap, draft);
    if (Object.keys(patch).length === 0) return;
    if (!draft.name.trim() || !draft.primaryContactId) {
      setGeneralError('Company name and primary contact are required.');
      return;
    }
    setSaving(true);
    try {
      await onUpdate(company.id, patch);
    } catch (err) {
      setGeneralError(companySaveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [company, draft, snap, onUpdate]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (snap) setDraft({ ...snap });
  }, [snap]);

  const startEditingName = () => {
    setNameValue(draft?.name ?? company?.name ?? '');
    setEditingName(true);
  };

  const commitNameToDraft = () => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    patchDraft({ name: trimmed });
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitNameToDraft();
    }
    if (e.key === 'Escape') {
      setEditingName(false);
      setNameValue(draft?.name ?? company?.name ?? '');
    }
  };

  if (!company || !draft || !snap) return null;

  const compType = getCompanyType(draft.type);
  const taxStatus = getTaxStatus(company.taxStatus);
  const sourcePageHref = `/clients/companies?openId=${encodeURIComponent(company.id)}`;

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
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={commitNameToDraft}
                    onKeyDown={handleNameKeyDown}
                    placeholder="Company name…"
                    className="border-primary text-foreground placeholder:text-muted-foreground/70 w-full border-0 border-b-2 bg-transparent text-xl font-bold tracking-tight outline-none"
                  />
                ) : (
                  <h2
                    onClick={startEditingName}
                    className="text-foreground -mx-1 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                    title="Click to edit company name"
                  >
                    {draft.name.trim() || company.name}
                  </h2>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {compType && <StatusBadge label={compType.label} variant={compType.variant} />}
                  {taxStatus && <StatusBadge label={taxStatus.label} variant={taxStatus.variant} />}
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
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(company.id)}>
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DetailSheetSettingsMenu>
                ) : null}
              </div>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <CompanySheetScrollBody
              company={company}
              draft={draft}
              patchDraft={patchDraft}
              saving={saving}
              generalError={generalError}
              searchContacts={searchContacts}
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
        variant="company"
        entityId={company.id}
        asSheet
        sheetOpen={portfolioOpen}
        onSheetOpenChange={setPortfolioOpen}
        forceNestedBackdrop
        sheetCloseOnlyBack
      />
    </>
  );
}
