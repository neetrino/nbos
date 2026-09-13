'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('credentials');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const isTrashList = vaultListScope === 'trash';

  const runExport = async (stepUpPassword: string) => {
    setExporting(true);
    try {
      const file = await credentialsApi.exportEncryptedFile({ stepUpPassword });
      downloadBase64File(file.filename, file.mimeType, file.contentBase64);
      toast.success(t('settings.exportSuccess', { count: file.count }));
    } catch {
      toast.error(t('settings.exportFailed'));
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
        title={t('settings.title', { module: t('title') })}
        description={isTrashList ? t('settings.descriptionTrash') : t('settings.descriptionActive')}
        triggerAriaLabel={t('settings.triggerAria')}
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
            {t('settings.backToVault')}
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
              {t('settings.exportFile')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start gap-2"
              onClick={() => handleVaultListScopeChange('trash')}
            >
              <Trash2 className="text-destructive size-4 shrink-0" aria-hidden />
              {t('settings.viewTrash')}
            </Button>
          </>
        )}
      </PageSettingsSheet>
      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title={t('settings.exportConfirm')}
        onConfirm={runExport}
      />
    </>
  );
}
