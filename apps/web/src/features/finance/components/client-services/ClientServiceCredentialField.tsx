'use client';

import { KeyRound } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useCredentialRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { useClientServicesT } from './client-service-message-keys';

interface ClientServiceCredentialFieldProps {
  credentialId: string;
  credentialLabel: string | null;
  disabled?: boolean;
  onSelect: (credentialId: string, label: string) => void;
  onClear: () => void;
}

export function ClientServiceCredentialField({
  credentialId,
  credentialLabel,
  disabled = false,
  onSelect,
  onClear,
}: ClientServiceCredentialFieldProps) {
  const t = useClientServicesT();
  const searchCredentials = useCredentialRelationSearch(null);
  const credentialPicker = useRelationPickerActions('credential');

  return (
    <RelationPickerField
      label={t('fields.credentials')}
      entityKind="credential"
      value={credentialId || null}
      selectionLabel={credentialLabel}
      placeholder={t('fields.credentialsPlaceholder')}
      icon={<KeyRound size={12} />}
      disabled={disabled}
      className="w-full min-w-0"
      onSearch={searchCredentials}
      onSelect={onSelect}
      onClear={onClear}
      {...credentialPicker}
    />
  );
}
