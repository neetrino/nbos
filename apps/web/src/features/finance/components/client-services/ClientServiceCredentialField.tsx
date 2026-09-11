'use client';

import { KeyRound } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useCredentialRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';

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
  const searchCredentials = useCredentialRelationSearch(null);
  const credentialPicker = useRelationPickerActions('credential');

  return (
    <RelationPickerField
      label="Credentials"
      entityKind="credential"
      value={credentialId || null}
      selectionLabel={credentialLabel}
      placeholder="Connect credentials"
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
