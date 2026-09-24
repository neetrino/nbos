'use client';

import { useState } from 'react';
import { ServerCog } from 'lucide-react';
import { toast } from 'sonner';
import { ItBrandMarkIcon } from '@/components/shared/it-brand-mark/ItBrandMarkIcon';
import { mailApi, type MailAccountRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { resolveItBrandMarkFromHints } from '@/lib/it-brand-marks/resolve-it-brand-mark';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { CorporateMailboxForm } from './CorporateMailboxForm';
import { corporateFormStateFromAccount } from './corporate-mailbox-form-state';
import { MailboxFormActions } from './mailbox-form-actions';
import { MailSheetPanelHeader } from './MailSheetPanelHeader';
import { MAIL_PROVIDER_TILE_CLASS, MAIL_SHEET_BODY_CLASS } from './mail-ui-classes';

const GMAIL_PROVIDER_TYPE = 'GMAIL';

export interface ConnectMailboxSheetProps {
  enabled: boolean;
  onConnected: () => void;
  onClose: () => void;
  onDelete?: () => void;
  reconnectAccount?: MailAccountRow | null;
}

type ConnectStep = 'choose' | 'corporate';

export function ConnectMailboxSheet({
  enabled,
  onConnected,
  onClose,
  onDelete,
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
      <MailSheetPanelHeader
        title={reconnectAccount ? 'Reconnect mailbox' : 'Connect mailbox'}
        description={
          reconnectAccount
            ? 'Update the saved settings and reconnect. Password can stay blank if it is already stored.'
            : step === 'choose'
              ? 'Choose a provider to connect a mailbox to NBOS.'
              : 'Enter the corporate mailbox IMAP and SMTP settings. A failed attempt still saves the mailbox so you can reconnect.'
        }
      />

      <div className={`${MAIL_SHEET_BODY_CLASS} overflow-y-auto`}>
        {step === 'choose' ? (
          <ProviderChoiceList
            gmailLoading={gmailLoading}
            onGmail={() => void startGmail()}
            onCorporate={() => setConnectStep('corporate')}
          />
        ) : reconnectAccount?.providerType === GMAIL_PROVIDER_TYPE ? (
          <GmailMailboxSettings
            lastError={reconnectAccount.providerConnection?.lastErrorMessage ?? null}
            submitting={gmailLoading}
            onCancel={onClose}
            onReconnect={() => void startGmail()}
            onDelete={onDelete}
          />
        ) : (
          <CorporateMailboxForm
            onCancel={reconnectAccount ? onClose : () => setConnectStep('choose')}
            onConnected={handleCorporateConnected}
            onDelete={onDelete}
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

function ProviderChoiceList({
  gmailLoading,
  onGmail,
  onCorporate,
}: {
  gmailLoading: boolean;
  onGmail: () => void;
  onCorporate: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onGmail}
        disabled={gmailLoading}
        className={MAIL_PROVIDER_TILE_CLASS}
      >
        <GmailProviderIcon />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-foreground font-medium">Gmail</span>
          <span className="text-muted-foreground text-xs leading-relaxed">
            Connect with Google (OAuth). Read &amp; send via Gmail API.
          </span>
        </span>
      </button>
      <button type="button" onClick={onCorporate} className={MAIL_PROVIDER_TILE_CLASS}>
        <ServerCog size={24} className="text-foreground mt-0.5 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-foreground font-medium">Corporate mail</span>
          <span className="text-muted-foreground text-xs leading-relaxed">
            Connect with IMAP + SMTP credentials.
          </span>
        </span>
      </button>
    </div>
  );
}

function GmailProviderIcon({ className = 'mt-0.5 size-6' }: { className?: string }) {
  const mark = resolveItBrandMarkFromHints('Gmail');
  if (!mark) {
    return null;
  }
  return <ItBrandMarkIcon mark={mark} className={className} />;
}

function GmailMailboxSettings({
  lastError,
  submitting,
  onCancel,
  onReconnect,
  onDelete,
}: {
  lastError: string | null;
  submitting: boolean;
  onCancel: () => void;
  onReconnect: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
        <h3 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
          <GmailProviderIcon className="size-3.5" />
          Gmail
        </h3>
        {lastError ? (
          <p className="text-destructive mb-3 text-sm" role="alert">
            {lastError}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Reconnect with Google if this mailbox needs a new OAuth grant.
          </p>
        )}
      </section>
      <MailboxFormActions
        submitting={submitting}
        cancelLabel="Cancel"
        primaryLabel={submitting ? 'Validating…' : 'Reconnect mailbox'}
        onCancel={onCancel}
        onSubmit={onReconnect}
        onDelete={onDelete}
      />
    </div>
  );
}
