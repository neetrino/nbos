'use client';

import type { ReactNode } from 'react';
import { Eye, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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

  const secretActions = (field: CredentialSecretField, label: string) => {
    if (!isExisting || !secretsPresent?.[field]) return null;
    const value = revealed?.[field];
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground font-mono text-xs">
          {value ? value : '••••••••'}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onReveal?.(field)}>
          <Eye size={14} aria-label={`Reveal ${label}`} />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onCopy?.(field)}>
          <Copy size={14} aria-label={`Copy ${label}`} />
        </Button>
      </div>
    );
  };

  return (
    <div className="grid gap-4">
      {specs.map((spec) => {
        if (spec.kind === 'env') {
          return (
            <div key={spec.field} className="grid gap-2">
              <Label>{spec.label}</Label>
              {isExisting && secretsPresent?.envData ? secretActions('envData', 'ENV') : null}
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
            <TextField
              key={spec.field}
              id="cred-login"
              label={spec.label}
              value={login}
              onChange={onLoginChange}
            />
          );
        }

        if (spec.field === 'url') {
          return (
            <TextField
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
              spec={spec}
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.password)}
              draft={password}
              onDraftChange={onPasswordChange}
              secretActions={secretActions('password', spec.label)}
            />
          );
        }

        if (spec.field === 'passphrase') {
          return (
            <SecretField
              key={spec.field}
              spec={spec}
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.passphrase)}
              draft={passphrase}
              onDraftChange={onPassphraseChange}
              secretActions={secretActions('passphrase', spec.label)}
            />
          );
        }

        if (spec.field === 'apiKey') {
          return (
            <SecretField
              key={spec.field}
              spec={spec}
              isExisting={isExisting}
              hasStored={Boolean(secretsPresent?.apiKey)}
              draft={apiKey}
              onDraftChange={onApiKeyChange}
              secretActions={secretActions('apiKey', spec.label)}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

function TextField({
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
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SecretField({
  spec,
  isExisting,
  hasStored,
  draft,
  onDraftChange,
  secretActions,
}: {
  spec: { label: string; kind: string; placeholder?: string };
  isExisting: boolean;
  hasStored: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  secretActions: React.ReactNode;
}) {
  const showRotate = isExisting && hasStored;

  if (spec.kind === 'textarea') {
    return (
      <div className="grid gap-2">
        <Label htmlFor="cred-private-key">{spec.label}</Label>
        {showRotate ? secretActions : null}
        <Textarea
          id="cred-private-key"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          className="min-h-[120px] font-mono text-xs"
          placeholder={showRotate ? 'Paste new key to rotate' : 'Paste private key'}
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="cred-secret-field">{spec.label}</Label>
      {showRotate ? secretActions : null}
      <Input
        id="cred-secret-field"
        type="password"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={showRotate ? 'Leave empty to keep current' : undefined}
        autoComplete="off"
      />
    </div>
  );
}
