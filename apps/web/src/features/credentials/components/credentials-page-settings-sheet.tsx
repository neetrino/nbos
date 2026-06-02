'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { downloadBase64File } from '@/features/credentials/utils/download-base64-file';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export function CredentialsPageSettingsSheet() {
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  return (
    <>
      <PageSettingsSheet
        title="Credentials — settings"
        description="Encrypted vault export. Requires step-up confirmation."
        triggerAriaLabel="Credentials settings"
      >
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
