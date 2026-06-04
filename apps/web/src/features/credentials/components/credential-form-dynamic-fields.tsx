'use client';

import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS } from '@/features/credentials/constants/credential-vault-copy';
import { useCredentialVaultCopyFeedback } from '@/features/credentials/hooks/use-credential-vault-copy-feedback';
import { CredentialEnvTableEditor } from './credential-env-table-editor';
import { CredentialVaultSecretField } from './credential-vault-secret-field';
import { dynamicFieldSpecsForType } from '@/features/credentials/credential-field-config';
import { CREDENTIAL_VAULT_INPUT_IGNORE_PROPS } from '@/features/credentials/constants/credential-vault-input-props';
import { useAutofillGuard } from '@/features/credentials/hooks/use-credential-field-autofill-guard';
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
  onCopy?: (field: CredentialSecretField) => void | Promise<boolean>;
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
                instanceKey={guardScope}
                value={envData}
                onChange={onEnvDataChange}
                isExisting={isExisting}
                hasStoredBundle={Boolean(secretsPresent?.envData)}
                valuesLocked={isExisting && !revealed?.envData && Boolean(secretsPresent?.envData)}
                revealedValue={revealed?.envData ?? null}
                onReveal={() => onReveal?.('envData')}
                onCopy={onCopy ? () => onCopy('envData') : undefined}
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
              showCopy={login.trim().length > 0}
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
            <CredentialVaultSecretField
              key={spec.field}
              guardKey={`${guardScope}-password`}
              fieldId="nbos-cred-password"
              label={spec.label}
              kind={spec.kind === 'textarea' ? 'textarea' : 'password'}
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.password)}
              draft={password}
              onDraftChange={onPasswordChange}
              revealedValue={revealed?.password}
              onReveal={() => onReveal?.('password')}
              onCopy={onCopy ? () => onCopy('password') : undefined}
            />
          );
        }

        if (spec.field === 'passphrase') {
          return (
            <CredentialVaultSecretField
              key={spec.field}
              guardKey={`${guardScope}-passphrase`}
              fieldId="nbos-cred-passphrase"
              label={spec.label}
              kind="password"
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.passphrase)}
              draft={passphrase}
              onDraftChange={onPassphraseChange}
              revealedValue={revealed?.passphrase}
              onReveal={() => onReveal?.('passphrase')}
              onCopy={onCopy ? () => onCopy('passphrase') : undefined}
            />
          );
        }

        if (spec.field === 'apiKey') {
          return (
            <CredentialVaultSecretField
              key={spec.field}
              guardKey={`${guardScope}-api-key`}
              fieldId="nbos-cred-api-key"
              label={spec.label}
              kind="password"
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.apiKey)}
              draft={apiKey}
              onDraftChange={onApiKeyChange}
              revealedValue={revealed?.apiKey}
              onReveal={() => onReveal?.('apiKey')}
              onCopy={onCopy ? () => onCopy('apiKey') : undefined}
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
      <Input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...CREDENTIAL_VAULT_INPUT_IGNORE_PROPS}
      />
    </div>
  );
}

async function copyPlainFieldValue(value: string): Promise<boolean> {
  const text = value.trim();
  if (!text) return false;
  await navigator.clipboard.writeText(text);
  toast.success('Copied');
  return true;
}

function preventCopyButtonBlur(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function GuardedTextField({
  guardKey,
  id,
  label,
  value,
  onChange,
  showCopy = false,
}: {
  guardKey: string;
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  showCopy?: boolean;
}) {
  const guard = useAutofillGuard(guardKey);
  const { copied, markCopied } = useCredentialVaultCopyFeedback();

  const handleCopy = () => {
    void copyPlainFieldValue(value).then((ok) => {
      if (ok) markCopied();
    });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {showCopy ? (
          <div className="absolute top-1/2 right-1 z-10 flex -translate-y-1/2 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onMouseDown={preventCopyButtonBlur}
              onClick={handleCopy}
              aria-label={`Copy ${label}`}
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </Button>
          </div>
        ) : null}
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
          className={cn(
            showCopy ? 'pr-10' : undefined,
            copied ? CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS : undefined,
          )}
          {...CREDENTIAL_VAULT_INPUT_IGNORE_PROPS}
        />
      </div>
    </div>
  );
}
