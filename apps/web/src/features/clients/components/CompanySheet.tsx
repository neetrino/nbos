'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
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
import {
  buildCompanyGeneralPatch,
  createCompanyGeneralDraft,
  isCompanyGeneralDirty,
  type CompanyGeneralDraft,
} from './company-general-form-state';
import { CompanySheetScrollBody } from './CompanySheetScrollBody';
import {
  ClientDetailTabBar,
  ClientPortfolioPanel,
  useClientPortfolioData,
} from './client-portfolio/ClientPortfolioEmbedded';
import type {
  ClientDetailTabId,
  ClientEmbeddedPortfolioTabId,
} from './client-portfolio/client-portfolio-tabs';

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
  const [activeTab, setActiveTab] = useState<ClientDetailTabId>('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const portfolio = useClientPortfolioData({
    variant: 'company',
    entityId: company?.id ?? null,
  });

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
    setActiveTab('general');
  }, [company?.id]);

  useEffect(() => {
    const allowedTabs = new Set(portfolio.tabs.map((tab) => tab.id));
    if (!allowedTabs.has(activeTab)) setActiveTab('general');
  }, [activeTab, portfolio.tabs]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        floatingClose
        floatingRailVisible={open}
        floatingRailAnchorClassName={DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS}
        floatingRail={<EntitySheetFloatingRail sourcePageHref={sourcePageHref} />}
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

        <ClientDetailTabBar activeTab={activeTab} tabs={portfolio.tabs} onSelect={setActiveTab} />

        <ScrollArea className="min-h-0 flex-1">
          {activeTab === 'general' ? (
            <CompanySheetScrollBody
              company={company}
              draft={draft}
              patchDraft={patchDraft}
              saving={saving}
              generalError={generalError}
              portfolioData={portfolio.data}
              portfolioLoading={portfolio.loading}
              portfolioError={portfolio.error}
              searchContacts={searchContacts}
              onPortfolioRetry={portfolio.reload}
            />
          ) : (
            <ClientPortfolioPanel
              tab={activeTab as ClientEmbeddedPortfolioTabId}
              data={portfolio.data}
              loading={portfolio.loading}
              error={portfolio.error}
              variant="company"
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
      </SheetContent>
    </Sheet>
  );
}
