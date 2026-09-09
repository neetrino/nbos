'use client';

import { useState } from 'react';
import { ArrowLeft, Download, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import type { CredentialVaultListScope } from '@/features/credentials/constants/credential-vault-page-state-storage';
import { downloadBase64File } from '@/features/credentials/utils/download-base64-file';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export interface CredentialsPageSettingsSheetProps {
  vaultListScope: CredentialVaultListScope;
  onVaultListScopeChange: (scope: CredentialVaultListScope) => void;
}

export function CredentialsPageSettingsSheet({
  vaultListScope,
  onVaultListScopeChange,
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
