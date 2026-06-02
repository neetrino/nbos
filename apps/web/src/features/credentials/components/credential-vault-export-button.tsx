'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { downloadBase64File } from '@/features/credentials/utils/download-base64-file';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export function CredentialVaultExportButton() {
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={exporting}
        onClick={() => setStepUpOpen(true)}
      >
        <Download size={14} className="mr-1.5" aria-hidden />
        Export file
      </Button>
      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title="Confirm to export credentials"
        onConfirm={runExport}
      />
    </>
  );
}
