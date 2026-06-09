'use client';

import { useState } from 'react';
import { Mail, ServerCog } from 'lucide-react';
import { toast } from 'sonner';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { mailApi } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { CorporateMailboxForm } from './CorporateMailboxForm';

export interface ConnectMailboxSheetProps {
  enabled: boolean;
  onConnected: () => void;
  onClose: () => void;
}

type ConnectStep = 'choose' | 'corporate';

const PROVIDER_TILE_CLASS =
  'border-border bg-card hover:bg-muted/60 focus-visible:ring-ring flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

export function ConnectMailboxSheet({ enabled, onConnected, onClose }: ConnectMailboxSheetProps) {
  const [step, setStep] = useState<ConnectStep>('choose');
  const [gmailLoading, setGmailLoading] = useState(false);

  if (!enabled) {
    return null;
  }

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

  const handleCorporateConnected = () => {
    onClose();
    onConnected();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="border-border shrink-0 border-b px-5 py-4">
        <SheetTitle>Connect mailbox</SheetTitle>
        <SheetDescription>
          {step === 'choose'
            ? 'Choose a provider to connect a mailbox to NBOS.'
            : 'Enter the corporate mailbox IMAP and SMTP settings.'}
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {step === 'choose' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void startGmail()}
              disabled={gmailLoading}
              className={PROVIDER_TILE_CLASS}
            >
              <Mail size={20} className="text-foreground" aria-hidden />
              <span className="text-foreground font-medium">Gmail</span>
              <span className="text-muted-foreground text-xs">
                Connect with Google (OAuth). Read &amp; send via Gmail API.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStep('corporate')}
              className={PROVIDER_TILE_CLASS}
            >
              <ServerCog size={20} className="text-foreground" aria-hidden />
              <span className="text-foreground font-medium">Corporate mail</span>
              <span className="text-muted-foreground text-xs">
                Connect with IMAP + SMTP credentials.
              </span>
            </button>
          </div>
        ) : (
          <CorporateMailboxForm
            onCancel={() => setStep('choose')}
            onConnected={handleCorporateConnected}
          />
        )}
      </div>
    </div>
  );
}
