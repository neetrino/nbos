'use client';

import { useState } from 'react';
import { Mail, ServerCog } from 'lucide-react';
import { toast } from 'sonner';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { mailApi, type MailAccountRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { CorporateMailboxForm } from './CorporateMailboxForm';
import { corporateFormStateFromAccount } from './corporate-mailbox-form-state';

export interface ConnectMailboxSheetProps {
  enabled: boolean;
  onConnected: () => void;
  onClose: () => void;
  reconnectAccount?: MailAccountRow | null;
}

type ConnectStep = 'choose' | 'corporate';

const PROVIDER_TILE_CLASS =
  'border-border bg-card hover:bg-muted/60 focus-visible:ring-ring flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

export function ConnectMailboxSheet({
  enabled,
  onConnected,
  onClose,
  reconnectAccount = null,
}: ConnectMailboxSheetProps) {
  const [connectStep, setConnectStep] = useState<ConnectStep>('choose');
  const [gmailLoading, setGmailLoading] = useState(false);
  const step: ConnectStep = reconnectAccount ? 'corporate' : connectStep;

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
        <SheetTitle>{reconnectAccount ? 'Reconnect mailbox' : 'Connect mailbox'}</SheetTitle>
        <SheetDescription>
          {reconnectAccount
            ? 'Update the saved settings and reconnect. Password can stay blank if it is already stored.'
            : step === 'choose'
              ? 'Choose a provider to connect a mailbox to NBOS.'
              : 'Enter the corporate mailbox IMAP and SMTP settings. A failed attempt still saves the mailbox so you can reconnect.'}
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
              onClick={() => setConnectStep('corporate')}
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
            onCancel={reconnectAccount ? onClose : () => setConnectStep('choose')}
            onConnected={handleCorporateConnected}
            mode={reconnectAccount ? 'reconnect' : 'connect'}
            accountId={reconnectAccount?.id}
            initial={reconnectAccount ? corporateFormStateFromAccount(reconnectAccount) : undefined}
            hasStoredPassword={reconnectAccount?.hasStoredPassword ?? false}
            lastError={reconnectAccount?.providerConnection?.lastErrorMessage ?? null}
          />
        )}
      </div>
    </div>
  );
}
