'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AtSign, Check, Copy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_MS } from '@/features/credentials/constants/credential-vault-copy';

const PASSWORD_MASK = '••••••';

const SECRET_PILL_CLASS = cn(
  'flex h-7 w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-left shadow-none outline-none',
  'transition-[background-color,box-shadow,opacity] duration-200',
  'group-hover/card:bg-muted/25 group-hover/card:shadow-[inset_0_0_0_1px_var(--border)]',
);

const SECRET_COPY_ICON_CLASS = cn(
  'flex size-7 shrink-0 items-center justify-center opacity-0 transition-opacity duration-200',
  'group-hover/card:opacity-100',
);

const SECRET_PILL_COPIED_CLASS = cn(
  'bg-emerald-500/15 text-emerald-800 shadow-[inset_0_0_0_1px_rgb(16_185_129/0.45)] dark:text-emerald-300',
  'group-hover/card:bg-emerald-500/15 group-hover/card:shadow-[inset_0_0_0_1px_rgb(16_185_129/0.45)]',
);

interface CredentialVaultSecretPillProps {
  icon: ReactNode;
  value: string;
  copyLabel: string;
  mono?: boolean;
  copied?: boolean;
  onCopy: () => void;
}

function CredentialVaultSecretPill({
  icon,
  value,
  copyLabel,
  mono = true,
  copied: copiedExternal = false,
  onCopy,
}: CredentialVaultSecretPillProps) {
  const [copiedLocal, setCopiedLocal] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copied = copiedExternal || copiedLocal;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onCopy();
    if (copiedExternal) return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setCopiedLocal(true);
    feedbackTimerRef.current = setTimeout(
      () => setCopiedLocal(false),
      CREDENTIAL_VAULT_COPY_FEEDBACK_MS,
    );
  };

  return (
    <button
      type="button"
      className={cn(SECRET_PILL_CLASS, copied && SECRET_PILL_COPIED_CLASS)}
      title={copyLabel}
      aria-label={copyLabel}
      onClick={handleCopy}
    >
      <span
        className={cn(
          'shrink-0',
          copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[11px] leading-tight',
          copied ? 'text-emerald-800 dark:text-emerald-200' : 'text-foreground',
          mono && 'font-mono',
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          copied ? 'text-emerald-600 opacity-100 dark:text-emerald-400' : 'text-muted-foreground',
          SECRET_COPY_ICON_CLASS,
          copied && 'opacity-100',
        )}
        aria-hidden
      >
        {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
      </span>
    </button>
  );
}

export interface CredentialVaultSecretPillsProps {
  login: string | null;
  showPassword: boolean;
  passwordCopied: boolean;
  onCopyLogin: (login: string) => void;
  onCopyPassword: () => void;
}

export function CredentialVaultSecretPills({
  login,
  showPassword,
  passwordCopied,
  onCopyLogin,
  onCopyPassword,
}: CredentialVaultSecretPillsProps) {
  if (!login && !showPassword) return null;

  return (
    <div className="flex flex-col gap-1">
      {login ? (
        <CredentialVaultSecretPill
          icon={<AtSign size={12} strokeWidth={2} />}
          value={login}
          copyLabel="Copy login"
          onCopy={() => onCopyLogin(login)}
        />
      ) : null}
      {showPassword ? (
        <CredentialVaultSecretPill
          icon={<Lock size={12} strokeWidth={2} />}
          value={PASSWORD_MASK}
          copyLabel="Copy password"
          copied={passwordCopied}
          mono
          onCopy={onCopyPassword}
        />
      ) : null}
    </div>
  );
}
