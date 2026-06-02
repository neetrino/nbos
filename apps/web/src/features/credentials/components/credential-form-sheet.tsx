'use client';

import { Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DetailSheetFormFooter, EntityDetailSheetContent } from '@/components/shared';
import { canUseCredentialEmergencyAccess } from '@/features/credentials/constants/credential-emergency-access';
import { CredentialEmergencyAccessPanel } from './credential-emergency-access-panel';
import { CredentialFormSheetBody } from './credential-form-sheet-body';
import { CredentialFormSheetHeader } from './credential-form-sheet-header';
import { CredentialStepUpDialog } from './credential-step-up-dialog';
import { useCredentialFormSheet } from '@/features/credentials/hooks/use-credential-form-sheet';
import type { CredentialFormSheetProps } from './credential-form-sheet-types';
import { usePermission } from '@/lib/permissions';

export type { CredentialFormSheetProps } from './credential-form-sheet-types';

export function CredentialFormSheet(props: CredentialFormSheetProps) {
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
    categoryLabel,
    criticality,
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent open={open} layout="full" width="medium">
          <div className="flex h-full min-h-0 flex-col">
            {!accessDenied && (
              <CredentialFormSheetHeader
                isCreate={isCreate}
                credentialId={credentialId}
                name={name}
                onNameChange={setName}
                accessLevel={accessLevel}
                categoryLabel={categoryLabel}
                criticality={criticality}
                showSettings={showSettings}
                onToggleSettings={() => setShowSettings((v) => !v)}
                onRequestArchive={onRequestArchive}
                resetKey={headerResetKey}
              />
            )}

            {loading ? (
              <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 p-8 text-sm">
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
                  manualGrants={manualGrants}
                  onManualGrantsChange={setManualGrants}
                />
              </ScrollArea>
            )}

            {!accessDenied && (
              <DetailSheetFormFooter
                visible={dirty}
                dirty={dirty}
                saving={saving}
                onSave={() => void handleSave()}
                onCancel={() => (isCreate ? onOpenChange(false) : void loadDetail())}
                saveLabel={isCreate ? submitLabel : 'Save'}
              />
            )}
          </div>
        </EntityDetailSheetContent>
      </Sheet>

      <CredentialStepUpDialog
        open={stepUpField !== null}
        onOpenChange={(o) => {
          if (!o) setStepUpField(null);
        }}
        title={stepUpMode === 'copy' ? 'Confirm to copy secret' : 'Confirm to reveal secret'}
        onConfirm={runStepUp}
      />
    </>
  );
}
