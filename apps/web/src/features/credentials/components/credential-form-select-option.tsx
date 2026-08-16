'use client';

import {
  CredentialCategoryIcon,
  CredentialTypeIcon,
} from '@/features/credentials/components/credential-meta-icon';

const CREDENTIAL_FORM_SELECT_ICON_CLASS = 'size-3.5 shrink-0 opacity-80';

export function CredentialFormSelectOption({
  kind,
  value,
  label,
}: {
  kind: 'category' | 'type';
  value: string;
  label: string;
}) {
  const icon =
    kind === 'category' ? (
      <CredentialCategoryIcon
        category={value}
        className={CREDENTIAL_FORM_SELECT_ICON_CLASS}
        aria-hidden
      />
    ) : (
      <CredentialTypeIcon
        credentialType={value}
        className={CREDENTIAL_FORM_SELECT_ICON_CLASS}
        aria-hidden
      />
    );

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}
