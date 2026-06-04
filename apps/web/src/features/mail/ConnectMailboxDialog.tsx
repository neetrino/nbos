'use client';

import { useState } from 'react';
import { Mail, ServerCog } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mailApi } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { CorporateMailboxForm } from './CorporateMailboxForm';

interface ConnectMailboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

type ConnectStep = 'choose' | 'corporate';

export function ConnectMailboxDialog({
  open,
  onOpenChange,
  onConnected,
}: ConnectMailboxDialogProps) {
  const [step, setStep] = useState<ConnectStep>('choose');
  const [gmailLoading, setGmailLoading] = useState(false);

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep('choose');
    }
    onOpenChange(next);
  };

  const startGmail = async () => {
    setGmailLoading(true);
    try {
      const { url } = await mailApi.startGmailOAuth();
      window.location.href = url;
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not start Gmail connection.'));
      setGmailLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect mailbox</DialogTitle>
          <DialogDescription>
            {step === 'choose'
              ? 'Choose a provider to connect a mailbox to NBOS.'
              : 'Enter the corporate mailbox IMAP and SMTP settings.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'choose' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void startGmail()}
              disabled={gmailLoading}
              className="border-border hover:bg-muted/60 flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors disabled:opacity-60"
            >
              <Mail size={20} aria-hidden />
              <span className="font-medium">Gmail</span>
              <span className="text-muted-foreground text-xs">
                Connect with Google (OAuth). Read &amp; send via Gmail API.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStep('corporate')}
              className="border-border hover:bg-muted/60 flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors"
            >
              <ServerCog size={20} aria-hidden />
              <span className="font-medium">Corporate mail</span>
              <span className="text-muted-foreground text-xs">
                Connect with IMAP + SMTP credentials.
              </span>
            </button>
          </div>
        ) : (
          <CorporateMailboxForm
            onCancel={() => setStep('choose')}
            onConnected={() => {
              handleClose(false);
              onConnected();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
