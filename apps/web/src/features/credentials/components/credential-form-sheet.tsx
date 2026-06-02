'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  EntityDetailSheetContent,
  StatusBadge,
} from '@/components/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import { canUseCredentialEmergencyAccess } from '@/features/credentials/constants/credential-emergency-access';
import { CredentialEmergencyAccessPanel } from './credential-emergency-access-panel';
import { CredentialFormSheetFields } from './credential-form-sheet-fields';
import { CredentialFormSheetPanels } from './credential-form-sheet-panels';
import { CredentialStepUpDialog } from './credential-step-up-dialog';
import { useCredentialFormSheet } from './use-credential-form-sheet';
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
  } = form;

  const showEmergency =
    accessDenied && credentialId && canUseCredentialEmergencyAccess(me?.role.slug);

  const accessMeta = getAccessLevel(accessLevel);
  const critMeta = getCredentialCriticality(criticality);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent open={open} layout="full" width="medium">
          <div className="flex h-full min-h-0 flex-col">
            {!accessDenied && (
              <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-6 py-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-0 bg-transparent p-0 text-lg font-semibold shadow-none focus-visible:ring-0"
                    placeholder="Credential name"
                    aria-label="Name"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {accessMeta && (
                      <StatusBadge label={accessMeta.label} variant={accessMeta.variant} />
                    )}
                    {critMeta && !isCreate && (
                      <StatusBadge label={critMeta.label} variant={critMeta.variant} />
                    )}
                    <span className="text-muted-foreground text-xs">{categoryLabel}</span>
                  </div>
                </div>
                {!isCreate && credentialId && onRequestArchive ? (
                  <DetailSheetSettingsMenu>
                    <DropdownMenuItem onClick={() => setShowSettings((v) => !v)}>
                      Advanced settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onRequestArchive(credentialId, name)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Archive
                    </DropdownMenuItem>
                  </DetailSheetSettingsMenu>
                ) : null}
              </div>
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
                <CredentialFormSheetFields form={form} />
                {!isCreate && credentialId ? (
                  <CredentialFormSheetPanels
                    sheetOpen={open}
                    credentialId={credentialId}
                    accessLevel={accessLevel}
                    detail={form.detail}
                  />
                ) : null}
              </ScrollArea>
            )}

            {!accessDenied && (
              <DetailSheetFormFooter
                visible={isCreate || dirty}
                dirty={isCreate ? name.trim().length > 0 : dirty}
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
