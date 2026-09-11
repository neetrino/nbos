'use client';

import { CLIENT_REPLY_LABEL, CLIENT_VISIBLE_LABEL } from './client-messenger.constants';
import { clientProviderLabel } from './client-messenger-section';

export function ClientLockedComposer({
  canSend,
  provider,
  contextLabel,
  onUnlock,
}: {
  canSend: boolean;
  provider: string | null | undefined;
  contextLabel: string;
  onUnlock: () => void;
}) {
  return (
    <div className="border-t border-teal-900/10 bg-[#EAF3F3] p-4">
      <p className="text-[11px] font-semibold tracking-wide text-teal-900 uppercase">
        Client conversation
      </p>
      <p className="mt-1 text-sm text-black/70">
        {clientProviderLabel(provider)} · {contextLabel}
      </p>
      {canSend ? (
        <button
          type="button"
          onClick={onUnlock}
          className="mt-3 rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          {CLIENT_REPLY_LABEL}
        </button>
      ) : (
        <p className="mt-3 text-sm text-black/45">
          You can read this conversation but cannot send.
        </p>
      )}
    </div>
  );
}

export function ClientUnlockedComposerBanner({
  provider,
  contextLabel,
}: {
  provider: string | null | undefined;
  contextLabel: string;
}) {
  return (
    <div className="border-t border-teal-900/15 bg-teal-800 px-4 py-2 text-white">
      <p className="text-[11px] font-semibold tracking-wide uppercase">{CLIENT_VISIBLE_LABEL}</p>
      <p className="text-sm">
        Sending via {clientProviderLabel(provider)} · {contextLabel}
      </p>
    </div>
  );
}
