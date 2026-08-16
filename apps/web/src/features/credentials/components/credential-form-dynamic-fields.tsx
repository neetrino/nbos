'use client';

import { credentialFormFieldIcon } from '@/features/credentials/utils/credential-vault-card-meta';
import { CredentialEnvTableEditor } from './credential-env-table-editor';
import { CredentialVaultSecretField } from './credential-vault-secret-field';
import {
  CredentialFormGuardedTextField,
  CredentialFormPlainTextField,
} from './credential-form-text-fields';
import {
  dynamicFieldSpecsForType,
  type DynamicFieldSpec,
} from '@/features/credentials/credential-field-config';
import type { CredentialSecretsPresent, CredentialSecretField } from '@/lib/api/credentials';

/** Login/Email + password share one row (SSH private-key textarea stays full width). */
const IDENTITY_PASSWORD_ROW_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

type DynamicFieldRow =
  | { type: 'single'; spec: DynamicFieldSpec }
  | { type: 'identity-password'; login: DynamicFieldSpec; password: DynamicFieldSpec };

function pairsWithPassword(identity: DynamicFieldSpec, password: DynamicFieldSpec | undefined) {
  return (
    identity.field === 'login' && password?.field === 'password' && password.kind !== 'textarea'
  );
}

function groupDynamicFieldRows(specs: readonly DynamicFieldSpec[]): DynamicFieldRow[] {
  const rows: DynamicFieldRow[] = [];
  for (let index = 0; index < specs.length; index += 1) {
    const spec = specs[index];
    const next = specs[index + 1];
    if (spec && next && pairsWithPassword(spec, next)) {
      rows.push({ type: 'identity-password', login: spec, password: next });
      index += 1;
      continue;
    }
    if (spec) rows.push({ type: 'single', spec });
  }
  return rows;
}

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
  envSnap?: string;
  secretsPresent?: CredentialSecretsPresent | null;
  revealed?: Partial<Record<CredentialSecretField, string>>;
  onReveal?: (field: CredentialSecretField) => void;
  onCopy?: (field: CredentialSecretField) => void | Promise<boolean>;
  onDownloadEnvBundle?: () => Promise<string | null>;
}

export function CredentialFormDynamicFields(props: CredentialFormDynamicFieldsProps) {
  const specs = dynamicFieldSpecsForType(props.credentialType);
  const rows = groupDynamicFieldRows(specs);
  const guardScope = props.credentialId ?? 'create';
  const isExisting = Boolean(props.credentialId);

  return (
    <div className="grid gap-4">
      {rows.map((row) =>
        row.type === 'identity-password' ? (
          <div key="login-password" className={IDENTITY_PASSWORD_ROW_CLASS}>
            <div className="min-w-0">
              <LoginField spec={row.login} guardScope={guardScope} {...props} />
            </div>
            <div className="min-w-0">
              <PasswordField
                spec={row.password}
                guardScope={guardScope}
                isExisting={isExisting}
                {...props}
              />
            </div>
          </div>
        ) : (
          <SingleDynamicField
            key={row.spec.field}
            spec={row.spec}
            guardScope={guardScope}
            isExisting={isExisting}
            {...props}
          />
        ),
      )}
    </div>
  );
}

function LoginField({
  spec,
  guardScope,
  login,
  onLoginChange,
}: {
  spec: DynamicFieldSpec;
  guardScope: string;
  login: string;
  onLoginChange: (v: string) => void;
}) {
  return (
    <CredentialFormGuardedTextField
      guardKey={`${guardScope}-login`}
      id="nbos-cred-login"
      label={spec.label}
      icon={credentialFormFieldIcon('login')}
      value={login}
      onChange={onLoginChange}
      showCopy={login.trim().length > 0}
    />
  );
}

function PasswordField({
  spec,
  guardScope,
  isExisting,
  password,
  onPasswordChange,
  secretsPresent,
  revealed,
  onReveal,
  onCopy,
}: {
  spec: DynamicFieldSpec;
  guardScope: string;
  isExisting: boolean;
  password: string;
  onPasswordChange: (v: string) => void;
  secretsPresent?: CredentialSecretsPresent | null;
  revealed?: Partial<Record<CredentialSecretField, string>>;
  onReveal?: (field: CredentialSecretField) => void;
  onCopy?: (field: CredentialSecretField) => void | Promise<boolean>;
}) {
  return (
    <CredentialVaultSecretField
      guardKey={`${guardScope}-password`}
      fieldId="nbos-cred-password"
      label={spec.label}
      icon={credentialFormFieldIcon('password')}
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

function SingleDynamicField({
  spec,
  guardScope,
  isExisting,
  ...props
}: CredentialFormDynamicFieldsProps & {
  spec: DynamicFieldSpec;
  guardScope: string;
  isExisting: boolean;
}) {
  if (spec.kind === 'env') {
    return (
      <CredentialEnvTableEditor
        instanceKey={guardScope}
        value={props.envData}
        onChange={props.onEnvDataChange}
        isExisting={isExisting}
        hasStoredBundle={Boolean(props.secretsPresent?.envData)}
        valuesLocked={
          isExisting && !props.revealed?.envData && Boolean(props.secretsPresent?.envData)
        }
        revealedValue={props.revealed?.envData ?? null}
        onReveal={() => props.onReveal?.('envData')}
        onCopy={props.onCopy ? () => props.onCopy?.('envData') : undefined}
        onDownload={props.onDownloadEnvBundle}
        storedKeysBaseline={props.envSnap ?? ''}
      />
    );
  }

  if (spec.field === 'login') {
    return <LoginField spec={spec} guardScope={guardScope} {...props} />;
  }

  if (spec.field === 'url') {
    return (
      <CredentialFormPlainTextField
        id="cred-url"
        label={spec.label}
        icon={credentialFormFieldIcon('url')}
        value={props.url}
        onChange={props.onUrlChange}
      />
    );
  }

  if (spec.field === 'password') {
    return <PasswordField spec={spec} guardScope={guardScope} isExisting={isExisting} {...props} />;
  }

  if (spec.field === 'passphrase' || spec.field === 'apiKey') {
    return (
      <ExtraSecretField spec={spec} guardScope={guardScope} isExisting={isExisting} {...props} />
    );
  }

  return null;
}

function ExtraSecretField({
  spec,
  guardScope,
  isExisting,
  passphrase,
  onPassphraseChange,
  apiKey,
  onApiKeyChange,
  secretsPresent,
  revealed,
  onReveal,
  onCopy,
}: CredentialFormDynamicFieldsProps & {
  spec: DynamicFieldSpec;
  guardScope: string;
  isExisting: boolean;
}) {
  const isPassphrase = spec.field === 'passphrase';
  const field = isPassphrase ? 'passphrase' : 'apiKey';
  const draft = isPassphrase ? passphrase : apiKey;
  const onDraftChange = isPassphrase ? onPassphraseChange : onApiKeyChange;
  const hasStored = Boolean(isPassphrase ? secretsPresent?.passphrase : secretsPresent?.apiKey);

  return (
    <CredentialVaultSecretField
      guardKey={`${guardScope}-${isPassphrase ? 'passphrase' : 'api-key'}`}
      fieldId={`nbos-cred-${isPassphrase ? 'passphrase' : 'api-key'}`}
      label={spec.label}
      icon={credentialFormFieldIcon(field)}
      kind="password"
      isExisting={isExisting}
      hasStored={hasStored}
      draft={draft}
      onDraftChange={onDraftChange}
      revealedValue={revealed?.[field]}
      onReveal={() => onReveal?.(field)}
      onCopy={onCopy ? () => onCopy(field) : undefined}
    />
  );
}
