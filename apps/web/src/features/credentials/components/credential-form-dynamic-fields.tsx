'use client';

import type { ReactNode } from 'react';
import { Eye, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CredentialEnvEditor } from './credential-env-editor';
import { dynamicFieldSpecsForType } from '@/features/credentials/credential-field-config';
import type { CredentialSecretsPresent, CredentialSecretField } from '@/lib/api/credentials';

export interface CredentialFormDynamicFieldsProps {
  credentialType: string;
  credentialId: string | null;
  login: string;
  onLoginChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
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
  apiKey,
  onApiKeyChange,
  phone,
  onPhoneChange,
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
            <EnvFieldBlock
              key={spec.field}
              isExisting={isExisting}
              envData={envData}
              onEnvDataChange={onEnvDataChange}
              secretsPresent={secretsPresent}
              secretActions={secretActions}
            />
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

        if (spec.field === 'phone') {
          return (
            <TextField
              key={spec.field}
              id="cred-phone"
              label={spec.label}
              value={phone}
              onChange={onPhoneChange}
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

function EnvFieldBlock({
  isExisting,
  envData,
  onEnvDataChange,
  secretsPresent,
  secretActions,
}: {
  isExisting: boolean;
  envData: string;
  onEnvDataChange: (v: string) => void;
  secretsPresent?: CredentialSecretsPresent | null;
  revealed?: Partial<Record<CredentialSecretField, string>>;
  secretActions: (field: CredentialSecretField, label: string) => ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>ENV bundle</Label>
      {isExisting && secretsPresent?.envData ? secretActions('envData', 'ENV') : null}
      <CredentialEnvEditor value={envData} onChange={onEnvDataChange} />
    </div>
  );
}
