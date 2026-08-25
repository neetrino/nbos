import type { ReactNode } from 'react';
import { ItBrandMarkIcon } from '@/components/shared/it-brand-mark/ItBrandMarkIcon';
import { resolveCredentialBrandMark } from '@/features/credentials/utils/resolve-credential-brand-mark';

interface CredentialBrandMarkProps {
  url?: string | null;
  provider?: string | null;
  name?: string | null;
  login?: string | null;
  category?: string | null;
  credentialType?: string | null;
  className?: string;
  fallback?: ReactNode;
}

/** Brand mark from provider/URL/name (login only for Mail), or `fallback` when unknown. */
export function CredentialBrandMark({
  url,
  provider,
  name,
  login,
  category,
  credentialType,
  className,
  fallback = null,
}: CredentialBrandMarkProps) {
  const mark = resolveCredentialBrandMark({
    provider,
    url,
    name,
    login,
    category,
    credentialType,
  });
  if (!mark) return fallback;
  return <ItBrandMarkIcon mark={mark} className={className} />;
}
