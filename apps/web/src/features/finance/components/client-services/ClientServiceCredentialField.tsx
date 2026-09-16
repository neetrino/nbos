'use client';

import { useCallback } from 'react';
import { KeyRound } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useCredentialRelationSearch,
  useRegisterRelationCreated,
  useRelationPickerActions,
  type RelationCreatedEvent,
} from '@/components/shared/relation-picker';
import { useClientServicesT } from './client-service-message-keys';

interface ClientServiceCredentialFieldProps {
  credentialId: string;
  credentialLabel: string | null;
  projectId?: string | null;
  disabled?: boolean;
  onSelect: (credentialId: string, label: string) => void;
  onClear: () => void;
}

const CREDENTIAL_CREATE_INTENT = 'client-service-credential';

export function ClientServiceCredentialField({
  credentialId,
  credentialLabel,
  projectId,
  disabled = false,
  onSelect,
  onClear,
}: ClientServiceCredentialFieldProps) {
  const t = useClientServicesT();
  const searchCredentials = useCredentialRelationSearch(null);
  const credentialPicker = useRelationPickerActions(
    'credential',
    CREDENTIAL_CREATE_INTENT,
    projectId ? { projectId } : undefined,
  );

  const handleCreated = useCallback(
    (event: RelationCreatedEvent) => {
      if (event.kind !== 'credential') return;
      if (event.intent && event.intent !== CREDENTIAL_CREATE_INTENT) return;
      onSelect(event.id, event.label);
    },
    [onSelect],
  );
  useRegisterRelationCreated(handleCreated);

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
