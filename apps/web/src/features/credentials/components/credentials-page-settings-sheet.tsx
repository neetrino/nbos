'use client';

import { useState, type ComponentPropsWithRef } from 'react';
import { ArrowLeft, Download, Loader2, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { MOBILE_DOCK_ITEM_CLASS } from '@/components/layout/mobile-bottom-nav-constants';
import { MOBILE_WORKSPACE_SETTINGS_LABEL } from '@/components/layout/mobile-workspace-dock-constants';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import type { CredentialVaultListScope } from '@/features/credentials/constants/credential-vault-page-state-storage';
import { downloadBase64File } from '@/features/credentials/utils/download-base64-file';
import { credentialsApi } from '@/lib/api/credentials';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type CredentialsPageSettingsTriggerVariant = 'icon' | 'dock';

export interface CredentialsPageSettingsSheetProps {
  vaultListScope: CredentialVaultListScope;
  onVaultListScopeChange: (scope: CredentialVaultListScope) => void;
  triggerVariant?: CredentialsPageSettingsTriggerVariant;
}

function CredentialsDockSettingsTrigger(props: ComponentPropsWithRef<'button'>) {
  return (
    <button
      {...props}
      type="button"
      className={cn(
        props.className,
        MOBILE_DOCK_ITEM_CLASS,
        'text-muted-foreground hover:text-foreground hover:bg-muted/70 h-auto w-full',
      )}
      aria-label={MOBILE_WORKSPACE_SETTINGS_LABEL}
    >
      <Settings size={18} aria-hidden />
      {MOBILE_WORKSPACE_SETTINGS_LABEL}
    </button>
  );
}

export function CredentialsPageSettingsSheet({
  vaultListScope,
  onVaultListScopeChange,
  triggerVariant = 'icon',
}: CredentialsPageSettingsSheetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const isTrashList = vaultListScope === 'trash';

  const runExport = async (stepUpPassword: string) => {
    setExporting(true);
    try {
      const file = await credentialsApi.exportEncryptedFile({ stepUpPassword });
      downloadBase64File(file.filename, file.mimeType, file.contentBase64);
      toast.success(`Exported ${file.count} credentials`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleVaultListScopeChange = (scope: CredentialVaultListScope) => {
    onVaultListScopeChange(scope);
    setSheetOpen(false);
  };

  return (
    <>
      <PageSettingsSheet
        title="Credentials — settings"
        description={
          isTrashList
            ? 'Trash view. Return to the active vault or restore items from the list.'
            : 'Encrypted vault export and access to Trash.'
        }
        triggerAriaLabel="Credentials settings"
        renderTrigger={triggerVariant === 'dock' ? CredentialsDockSettingsTrigger : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      >
        {isTrashList ? (
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => handleVaultListScopeChange('active')}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Back to vault
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="justify-start gap-2"
              disabled={exporting}
              onClick={() => setStepUpOpen(true)}
            >
              {exporting ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4 shrink-0" aria-hidden />
              )}
              Export file
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start gap-2"
              onClick={() => handleVaultListScopeChange('trash')}
            >
              <Trash2 className="text-destructive size-4 shrink-0" aria-hidden />
              View Trash
            </Button>
          </>
        )}
      </PageSettingsSheet>
      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title="Confirm to export credentials"
        onConfirm={runExport}
      />
    </>
  );
}
