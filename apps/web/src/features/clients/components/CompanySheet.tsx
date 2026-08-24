'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet } from '@/components/ui/sheet';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm';
import { DetailSheetFormFooter } from '@/components/shared/DetailSheetFormFooter';
import { DetailSheetSettingsMenu } from '@/components/shared/DetailSheetSettingsMenu';
import { DetailSheetTabPanel } from '@/components/shared/DetailSheetTabPanel';
import { EntityDetailSheetContent } from '@/components/shared/EntityDetailSheetContent';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
  CONTACT_SHEET_BODY_SCROLL_CLASS,
  CONTACT_SHEET_CONTENT_WIDTH_CLASS,
  CONTACT_SHEET_RAIL_ANCHOR_CLASS,
} from './contact-sheet-layout';
import type { RelationCreatedEvent } from '@/components/shared/relation-picker/relation-created-event';
import { useRegisterRelationCreated } from '@/components/shared/relation-picker/use-register-relation-created';
import { applyCompanyRelationCreated } from './apply-company-relation-created';
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

interface CompanySheetProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  isTrashView?: boolean;
  onMoveToTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  forceNestedBackdrop?: boolean;
  /** Project About: unlink company from this project. */
  onRemoveParticipant?: () => void | Promise<void>;
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
  isTrashView = false,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  forceNestedBackdrop = false,
  onRemoveParticipant,
}: CompanySheetProps) {
  const { persistedValue: renderCompany, onOpenChangeComplete } = useSheetPersistedValue(company);
  const hostMounted = useSheetHostMounted(open, renderCompany);

  const searchContacts = useContactSearchOptions();
  const [draft, setDraft] = useState<CompanyGeneralDraft | null>(null);
  const [snap, setSnap] = useState<CompanyGeneralDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [removeFromProjectOpen, setRemoveFromProjectOpen] = useState(false);
  const [removingFromProject, setRemovingFromProject] = useState(false);
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
      setRemoveFromProjectOpen(false);
      setRemovingFromProject(false);
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
    if (!draft.name.trim()) {
      setGeneralError('Company name is required.');
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

  const handleRelationCreated = useCallback((event: RelationCreatedEvent) => {
    setDraft((prev) => (prev ? { ...prev, ...applyCompanyRelationCreated(prev, event) } : null));
  }, []);

  useRegisterRelationCreated(open && draft ? handleRelationCreated : null);

  const startEditingName = () => {
    if (isTrashView) return;
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

  const isHydrated = Boolean(renderCompany && draft && snap);
  const compType = draft ? getCompanyType(draft.type) : undefined;
  const taxStatus = renderCompany ? getTaxStatus(renderCompany.taxStatus) : undefined;
  const sourcePageHref = renderCompany
    ? `/clients/companies?openId=${encodeURIComponent(renderCompany.id)}`
    : '/clients/companies';
  const displayName = draft?.name.trim() || renderCompany?.name || 'Company';

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        contentClassName={CONTACT_SHEET_CONTENT_WIDTH_CLASS}
        railAnchorClassName={CONTACT_SHEET_RAIL_ANCHOR_CLASS}
        sourcePageHref={sourcePageHref}
        forceNestedBackdrop={forceNestedBackdrop}
        showRailActions={isHydrated}
      >
        {!isHydrated || !renderCompany || !draft || !snap ? (
          <div className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
            Loading company…
          </div>
        ) : (
          <>
            <div className="bg-background shrink-0 px-5 pt-5 pb-3">
              <div className="flex min-h-9 min-w-0 flex-nowrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 flex-nowrap items-center gap-2">
                    {editingName ? (
                      <input
                        ref={nameInputRef}
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onBlur={commitNameToDraft}
                        onKeyDown={handleNameKeyDown}
                        placeholder="Company name…"
                        className="border-primary text-foreground placeholder:text-muted-foreground/70 min-w-0 flex-1 border-0 border-b-2 bg-transparent text-xl font-bold tracking-tight outline-none"
                      />
                    ) : (
                      <h2
                        onClick={startEditingName}
                        className="text-foreground -mx-1 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                        title="Click to edit company name"
                      >
                        {displayName}
                      </h2>
                    )}
                    {compType ? (
                      <StatusBadge
                        label={compType.label}
                        variant={compType.variant}
                        className="shrink-0 self-center"
                      />
                    ) : null}
                    {taxStatus ? (
                      <StatusBadge
                        label={taxStatus.label}
                        variant={taxStatus.variant}
                        className="shrink-0 self-center"
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex h-9 shrink-0 items-center gap-1.5">
                  {onRemoveParticipant ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      disabled={removingFromProject || saving}
                      onClick={() => setRemoveFromProjectOpen(true)}
                      aria-label="Remove company from project"
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  ) : null}
                  {!isTrashView ? (
                    <ClientPortfolioQuickActionsHeader
                      variant="company"
                      entityId={renderCompany.id}
                      data={portfolio.data}
                      loading={portfolio.loading}
                    />
                  ) : null}
                  {isTrashView && onRestore ? (
                    <DetailSheetSettingsMenu>
                      <DropdownMenuItem onClick={() => onRestore(renderCompany.id)}>
                        <RotateCcw />
                        Restore
                      </DropdownMenuItem>
                      {onPermanentDelete ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onPermanentDelete(renderCompany.id)}
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
                        onClick={() => onMoveToTrash(renderCompany.id)}
                      >
                        <Trash2 />
                        Move to Trash
                      </DropdownMenuItem>
                    </DetailSheetSettingsMenu>
                  ) : null}
                </div>
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
                  <CompanySheetScrollBody
                    company={renderCompany}
                    draft={draft}
                    patchDraft={patchDraft}
                    saving={saving}
                    readOnly={isTrashView}
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
          </>
        )}
      </EntityDetailSheetContent>

      {onRemoveParticipant && renderCompany && draft ? (
        <DeleteConfirmDialog
          open={removeFromProjectOpen}
          onOpenChange={setRemoveFromProjectOpen}
          level="simple"
          itemName={displayName}
          title="Remove company?"
          description="The company will be unlinked from this project. You can link it again later."
          confirmLabel="Remove"
          isSubmitting={removingFromProject}
          forceNestedBackdrop
          onConfirm={() => void handleRemoveFromProject()}
        />
      ) : null}
    </Sheet>
  );
}
