'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  EntityDetailSheetContent,
} from '@/components/shared';
import {
  CREDENTIAL_FORM_SHEET_TABS,
  type CredentialFormSheetTab,
} from '@/features/credentials/constants/credential-form-sheet-tabs';
import { buildCredentialVaultHref } from '@/features/credentials/constants/credential-vault-deep-link';
import { canUseCredentialEmergencyAccess } from '@/features/credentials/constants/credential-emergency-access';
import { CredentialEmergencyAccessPanel } from './credential-emergency-access-panel';
import { CredentialFormSheetBody } from './credential-form-sheet-body';
import { CredentialFormSheetHeader } from './credential-form-sheet-header';
import { CredentialStepUpDialog } from './credential-step-up-dialog';
import { CredentialTypeChangeDialog } from './credential-type-change-dialog';
import { CREDENTIAL_TYPES } from '@/features/credentials/constants/credentials';
import {
  CredentialVaultSessionProvider,
  useCredentialVaultSessionContext,
} from '@/features/credentials/hooks/use-credential-vault-session';
import { useCredentialFormSheet } from '@/features/credentials/hooks/use-credential-form-sheet';
import type { CredentialFormSheetProps } from './credential-form-sheet-types';
import { usePermission } from '@/lib/permissions';

export type { CredentialFormSheetProps } from './credential-form-sheet-types';

export function CredentialFormSheet(props: CredentialFormSheetProps) {
  const parentVaultSession = useCredentialVaultSessionContext();
  if (parentVaultSession) {
    return <CredentialFormSheetInner {...props} />;
  }
  return (
    <CredentialVaultSessionProvider>
      <CredentialFormSheetInner {...props} />
    </CredentialVaultSessionProvider>
  );
}

function CredentialFormSheetInner(props: CredentialFormSheetProps) {
  const { open, onOpenChange, onRequestArchive } = props;
  const { me } = usePermission();
  const form = useCredentialFormSheet(props);
  const {
    isCreate,
    credentialId,
    loading,
    saving,
    name,
    setName,
    accessLevel,
    category,
    setCategory,
    categoryOptions,
    categoryLocked,
    categoryLabel,
    criticality,
    credentialType,
    pendingTypeChange,
    setPendingTypeChange,
    confirmPendingTypeChange,
    showSettings,
    setShowSettings,
    dirty,
    handleSave,
    loadDetail,
    submitLabel,
    stepUpField,
    setStepUpField,
    stepUpMode,
    runStepUp,
    accessDenied,
    manualGrants,
    setManualGrants,
  } = form;

  const showEmergency =
    accessDenied && credentialId && canUseCredentialEmergencyAccess(me?.role.slug);

  const headerResetKey = `${open}|${credentialId ?? 'create'}`;
  const sourcePageHref = credentialId ? buildCredentialVaultHref(credentialId) : '/credentials';
  const [activeTab, setActiveTab] = useState<CredentialFormSheetTab>('general');
  const prevSheetOpenRef = useRef(false);
  const prevCredentialIdRef = useRef<string | null>(null);

  useEffect(() => {
    const opened = open && !prevSheetOpenRef.current;
    const idChanged = credentialId !== prevCredentialIdRef.current;
    if (open && (opened || idChanged)) {
      setActiveTab('general');
    }
    prevSheetOpenRef.current = open;
    prevCredentialIdRef.current = credentialId;
  }, [open, credentialId]);

  const showFormFooter = !accessDenied && !loading;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="medium"
          sourcePageHref={sourcePageHref}
        >
          {!accessDenied && (
            <CredentialFormSheetHeader
              isCreate={isCreate}
              credentialId={credentialId}
              name={name}
              onNameChange={setName}
              accessLevel={accessLevel}
              category={category}
              categoryLabel={categoryLabel}
              categoryOptions={categoryOptions}
              categoryLocked={categoryLocked}
              onCategoryChange={setCategory}
              criticality={criticality}
              showSettings={showSettings}
              onToggleSettings={() => setShowSettings((v) => !v)}
              onRequestArchive={onRequestArchive}
              resetKey={headerResetKey}
            />
          )}

          {!loading && !accessDenied && credentialId ? (
            <DetailSheetTabBar
              tabs={CREDENTIAL_FORM_SHEET_TABS}
              activeTab={activeTab}
              onTabChange={(value) => setActiveTab(value as CredentialFormSheetTab)}
              className="border-border shrink-0 border-b px-6"
            />
          ) : null}

          {loading ? (
            <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center gap-2 p-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : accessDenied ? (
            <ScrollArea className="min-h-0 flex-1">
              {showEmergency ? (
                <CredentialEmergencyAccessPanel
                  credentialId={credentialId!}
                  onGranted={() => void loadDetail()}
                />
              ) : (
                <p className="text-muted-foreground px-6 py-8 text-sm">
                  You do not have access to this credential.
                </p>
              )}
            </ScrollArea>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <CredentialFormSheetBody
                form={form}
                sheetOpen={open}
                credentialId={credentialId}
                activeTab={activeTab}
                manualGrants={manualGrants}
                onManualGrantsChange={setManualGrants}
              />
            </ScrollArea>
          )}

          <DetailSheetFormFooter
            visible={showFormFooter}
            dirty={dirty}
            saving={saving}
            onSave={() => void handleSave()}
            onCancel={() => (isCreate ? onOpenChange(false) : void loadDetail())}
            saveLabel={isCreate ? submitLabel : 'Save'}
          />
        </EntityDetailSheetContent>
      </Sheet>

      <CredentialTypeChangeDialog
        open={pendingTypeChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTypeChange(null);
        }}
        fromLabel={
          CREDENTIAL_TYPES.find((t) => t.value === credentialType)?.label ?? credentialType
        }
        toLabel={
          CREDENTIAL_TYPES.find((t) => t.value === pendingTypeChange)?.label ??
          pendingTypeChange ??
          ''
        }
        onConfirm={confirmPendingTypeChange}
      />

      <CredentialStepUpDialog
        open={stepUpField !== null}
        onOpenChange={(o) => {
          if (!o) setStepUpField(null);
        }}
        title={
          stepUpMode === 'copy'
            ? 'Unlock vault to copy critical secret'
            : 'Unlock vault to reveal critical secret'
        }
        onConfirm={runStepUp}
      />
    </>
  );
}
