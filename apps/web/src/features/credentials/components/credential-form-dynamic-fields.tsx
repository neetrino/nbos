'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CredentialEnvTableEditor } from './credential-env-table-editor';
import { dynamicFieldSpecsForType } from '@/features/credentials/credential-field-config';
import type { CredentialSecretsPresent, CredentialSecretField } from '@/lib/api/credentials';

export interface CredentialFormDynamicFieldsProps {
  credentialType: string;
  credentialId: string | null;
  login: string;
  onLoginChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  passphrase: string;
  onPassphraseChange: (v: string) => void;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  url: string;
  onUrlChange: (v: string) => void;
  envData: string;
  onEnvDataChange: (v: string) => void;
  secretsPresent?: CredentialSecretsPresent | null;
  revealed?: Partial<Record<CredentialSecretField, string>>;
  onReveal?: (field: CredentialSecretField) => void;
  onCopy?: (field: CredentialSecretField) => void;
}

/** Chrome treats login+password as sign-in; block injected values until user focuses. */
function useAutofillGuard(scopeKey: string) {
  const [editable, setEditable] = useState(false);
  useEffect(() => {
    setEditable(false);
  }, [scopeKey]);
  const onFocus = useCallback(() => setEditable(true), []);
  return { readOnly: !editable, onFocus, acceptChange: editable };
}

export function CredentialFormDynamicFields({
  credentialType,
  credentialId,
  login,
  onLoginChange,
  password,
  onPasswordChange,
  passphrase,
  onPassphraseChange,
  apiKey,
  onApiKeyChange,
  url,
  onUrlChange,
  envData,
  onEnvDataChange,
  secretsPresent,
  revealed,
  onReveal,
  onCopy,
}: CredentialFormDynamicFieldsProps) {
  const specs = dynamicFieldSpecsForType(credentialType);
  const isExisting = Boolean(credentialId);
  const guardScope = credentialId ?? 'create';

  return (
    <div className="grid gap-4">
      {specs.map((spec) => {
        if (spec.kind === 'env') {
          return (
            <div key={spec.field} className="grid gap-2">
              <Label>{spec.label}</Label>
              <CredentialEnvTableEditor
                value={envData}
                onChange={onEnvDataChange}
                isExisting={isExisting}
                revealedValue={revealed?.envData ?? null}
                onReveal={() => onReveal?.('envData')}
                onCopy={() => onCopy?.('envData')}
                disabled={isExisting && !revealed?.envData && Boolean(secretsPresent?.envData)}
              />
            </div>
          );
        }

        if (spec.field === 'login') {
          return (
            <GuardedTextField
              key={spec.field}
              guardKey={`${guardScope}-login`}
              id="nbos-cred-login"
              label={spec.label}
              value={login}
              onChange={onLoginChange}
            />
          );
        }

        if (spec.field === 'url') {
          return (
            <PlainTextField
              key={spec.field}
              id="cred-url"
              label={spec.label}
              value={url}
              onChange={onUrlChange}
            />
          );
        }

        if (spec.field === 'password') {
          return (
            <SecretField
              key={spec.field}
              guardKey={`${guardScope}-password`}
              fieldId="nbos-cred-password"
              spec={spec}
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.password)}
              draft={password}
              onDraftChange={onPasswordChange}
              revealedValue={revealed?.password}
              onReveal={() => onReveal?.('password')}
              onCopy={() => onCopy?.('password')}
            />
          );
        }

        if (spec.field === 'passphrase') {
          return (
            <SecretField
              key={spec.field}
              guardKey={`${guardScope}-passphrase`}
              fieldId="nbos-cred-passphrase"
              spec={spec}
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.passphrase)}
              draft={passphrase}
              onDraftChange={onPassphraseChange}
              revealedValue={revealed?.passphrase}
              onReveal={() => onReveal?.('passphrase')}
              onCopy={() => onCopy?.('passphrase')}
            />
          );
        }

        if (spec.field === 'apiKey') {
          return (
            <SecretField
              key={spec.field}
              guardKey={`${guardScope}-api-key`}
              fieldId="nbos-cred-api-key"
              spec={spec}
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.apiKey)}
              draft={apiKey}
              onDraftChange={onApiKeyChange}
              revealedValue={revealed?.apiKey}
              onReveal={() => onReveal?.('apiKey')}
              onCopy={() => onCopy?.('apiKey')}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

function PlainTextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
    </div>
  );
}

function GuardedTextField({
  guardKey,
  id,
  label,
  value,
  onChange,
}: {
  guardKey: string;
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const guard = useAutofillGuard(guardKey);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        value={value}
        readOnly={guard.readOnly}
        onFocus={guard.onFocus}
        onChange={(e) => {
          if (!guard.acceptChange) return;
          onChange(e.target.value);
        }}
        autoComplete="off"
      />
    </div>
  );
}

function SecretField({
  guardKey,
  fieldId,
  spec,
  isExisting,
  hasStored,
  draft,
  onDraftChange,
  revealedValue,
  onReveal,
  onCopy,
}: {
  guardKey: string;
  fieldId: string;
  spec: { label: string; kind: string; placeholder?: string };
  isExisting: boolean;
  hasStored: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  revealedValue?: string;
  onReveal?: () => void;
  onCopy?: () => void;
}) {
  const guard = useAutofillGuard(guardKey);
  const showActions = isExisting && hasStored;
  const displayValue = draft.length > 0 ? draft : (revealedValue ?? '');
  const inputType = revealedValue || draft.length > 0 ? 'text' : 'password';
  const actionPadding = showActions ? 'pr-20' : undefined;

  const handleChange = (next: string) => {
    if (!guard.acceptChange) return;
    onDraftChange(next);
  };

  const actionButtons = showActions ? (
    <div
      className={cn(
        'absolute z-10 flex items-center gap-0.5',
        spec.kind === 'textarea' ? 'top-2 right-2' : 'top-1/2 right-1 -translate-y-1/2',
      )}
    >
      <Button type="button" variant="ghost" size="icon-sm" onClick={onReveal}>
        <Eye size={14} aria-label={`Reveal ${spec.label}`} />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onCopy}>
        <Copy size={14} aria-label={`Copy ${spec.label}`} />
      </Button>
    </div>
  ) : null;

  if (spec.kind === 'textarea') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldId}>{spec.label}</Label>
        <div className="relative">
          {actionButtons}
          <Textarea
            id={fieldId}
            name={fieldId}
            value={displayValue}
            readOnly={guard.readOnly}
            onFocus={guard.onFocus}
            onChange={(e) => handleChange(e.target.value)}
            className={cn('min-h-[120px] font-mono text-xs', actionPadding)}
            placeholder={showActions ? 'Paste new key to rotate' : 'Paste private key'}
            autoComplete="new-password"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{spec.label}</Label>
      <div className="relative">
        {actionButtons}
        <Input
          id={fieldId}
          name={fieldId}
          type={inputType}
          value={displayValue}
          readOnly={guard.readOnly}
          onFocus={guard.onFocus}
          onChange={(e) => handleChange(e.target.value)}
          className={actionPadding}
          placeholder={showActions && !displayValue ? 'Leave empty to keep current' : undefined}
          autoComplete="new-password"
        />
      </div>
    </div>
  );
}
