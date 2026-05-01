'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, Copy, Loader2, ExternalLink } from 'lucide-react';
import {
  credentialsApi,
  type CredentialDetail,
  type CredentialSecretField,
} from '@/lib/api/credentials';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const SECRET_LABELS: Record<CredentialSecretField, string> = {
  password: 'Password',
  apiKey: 'API key',
  envData: 'Environment data',
  secureNotes: 'Secure notes',
};

interface CredentialDetailDialogProps {
  credentialId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CredentialDetailDialog({
  credentialId,
  open,
  onOpenChange,
}: CredentialDetailDialogProps) {
  const [detail, setDetail] = useState<CredentialDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Partial<Record<CredentialSecretField, string>>>({});

  const load = useCallback(async () => {
    if (!credentialId) return;
    setLoading(true);
    setRevealed({});
    try {
      const data = await credentialsApi.getById(credentialId);
      setDetail(data);
    } catch {
      setDetail(null);
      toast.error('Failed to load credential');
    } finally {
      setLoading(false);
    }
  }, [credentialId]);

  useEffect(() => {
    if (open && credentialId) void load();
    if (!open) {
      setDetail(null);
      setRevealed({});
    }
  }, [open, credentialId, load]);

  const handleReveal = async (field: CredentialSecretField) => {
    if (!credentialId) return;
    try {
      const { value } = await credentialsApi.revealSecret(credentialId, field);
      setRevealed((prev) => ({ ...prev, [field]: value }));
    } catch {
      toast.error('Could not reveal secret');
    }
  };

  const handleCopy = async (field: CredentialSecretField) => {
    if (!credentialId) return;
    try {
      const { value } = await credentialsApi.copySecret(credentialId, field);
      await navigator.clipboard.writeText(value);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy secret');
    }
  };

  const handleOpenUrl = async () => {
    if (!credentialId) return;
    try {
      const { url } = await credentialsApi.recordUrlOpened(credentialId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Could not open URL');
    }
  };

  const presentFields = (['password', 'apiKey', 'envData', 'secureNotes'] as const).filter(
    (f) => detail?.secretsPresent[f],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{detail?.name ?? 'Credential'}</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {!loading && detail && (
          <div className="grid gap-4 py-2 text-sm">
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted-foreground">Provider</span>
              <span className="col-span-2">{detail.provider ?? '—'}</span>
              <span className="text-muted-foreground">Type</span>
              <span className="col-span-2">{detail.credentialType.replaceAll('_', ' ')}</span>
              <span className="text-muted-foreground">Criticality</span>
              <span className="col-span-2">{detail.criticality}</span>
              <span className="text-muted-foreground">Environment</span>
              <span className="col-span-2">{detail.environment ?? '—'}</span>
              <span className="text-muted-foreground">Next rotation</span>
              <span className="col-span-2">
                {detail.nextRotationAt ? new Date(detail.nextRotationAt).toLocaleDateString() : '—'}
              </span>
              <span className="text-muted-foreground">Public notes</span>
              <span className="col-span-2 whitespace-pre-wrap">{detail.publicNotes ?? '—'}</span>
              <span className="text-muted-foreground">Login</span>
              <span className="col-span-2 font-mono text-xs">{detail.login ?? '—'}</span>
              <span className="text-muted-foreground">URL</span>
              <span className="col-span-2 flex flex-wrap items-center gap-2 break-all">
                {detail.url ? (
                  <>
                    <span className="min-w-0 flex-1">{detail.url}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1"
                      onClick={() => void handleOpenUrl()}
                    >
                      <ExternalLink size={12} />
                      Open
                    </Button>
                  </>
                ) : (
                  '—'
                )}
              </span>
            </div>
            {presentFields.length === 0 ? (
              <p className="text-muted-foreground text-xs">No encrypted secrets on this record.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs">
                  Secrets are hidden until you reveal or copy; actions are audited.
                </p>
                {presentFields.map((field) => (
                  <div
                    key={field}
                    className="border-border flex flex-col gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{SECRET_LABELS[field]}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => void handleReveal(field)}
                        >
                          <Eye size={12} />
                          Reveal
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => void handleCopy(field)}
                        >
                          <Copy size={12} />
                          Copy
                        </Button>
                      </div>
                    </div>
                    {revealed[field] !== undefined ? (
                      <pre className="bg-muted max-h-32 overflow-auto rounded p-2 font-mono text-xs break-words whitespace-pre-wrap">
                        {revealed[field]}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground font-mono text-xs">••••••••</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
