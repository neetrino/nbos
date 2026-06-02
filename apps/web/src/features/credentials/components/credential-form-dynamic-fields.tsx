'use client';

import { Eye, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CredentialEnvEditor } from './credential-env-editor';
import { fieldsForCredentialType } from '@/features/credentials/credential-field-config';
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
  const fields = fieldsForCredentialType(credentialType);
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
      {fields.includes('url') && (
        <div className="grid gap-2">
          <Label htmlFor="cred-url">URL</Label>
          <Input id="cred-url" value={url} onChange={(e) => onUrlChange(e.target.value)} />
        </div>
      )}
      {fields.includes('login') && (
        <div className="grid gap-2">
          <Label htmlFor="cred-login">Login</Label>
          <Input id="cred-login" value={login} onChange={(e) => onLoginChange(e.target.value)} />
        </div>
      )}
      {fields.includes('phone') && (
        <div className="grid gap-2">
          <Label htmlFor="cred-phone">Phone</Label>
          <Input id="cred-phone" value={phone} onChange={(e) => onPhoneChange(e.target.value)} />
        </div>
      )}
      {fields.includes('password') &&
        (isExisting && secretsPresent?.password ? (
          <div className="grid gap-2">
            <Label>Password</Label>
            {secretActions('password', 'password')}
            <Input
              type="password"
              placeholder="Leave empty to keep current"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="cred-password">Password</Label>
            <Input
              id="cred-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="off"
            />
          </div>
        ))}
      {fields.includes('apiKey') &&
        (isExisting && secretsPresent?.apiKey ? (
          <div className="grid gap-2">
            <Label>API key</Label>
            {secretActions('apiKey', 'API key')}
            <Input
              type="password"
              placeholder="Leave empty to keep current"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="cred-apikey">API key</Label>
            <Input
              id="cred-apikey"
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              autoComplete="off"
            />
          </div>
        ))}
      {fields.includes('envData') &&
        (isExisting && secretsPresent?.envData ? (
          <div className="grid gap-2">
            <Label>ENV bundle</Label>
            {secretActions('envData', 'ENV')}
            <CredentialEnvEditor value={envData} onChange={onEnvDataChange} />
          </div>
        ) : (
          <CredentialEnvEditor value={envData} onChange={onEnvDataChange} />
        ))}
    </div>
  );
}

// silence unused FIELD_LABELS if needed - actually remove FIELD_LABELS if unused
