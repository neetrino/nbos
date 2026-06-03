'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREDENTIAL_TYPES } from '@/features/credentials/constants/credentials';
import {
  CREDENTIAL_TYPES_FOR_CREATE,
  commentLabelForType,
  isProviderFirstForType,
  showsProviderPicker,
} from '@/features/credentials/credential-field-config';
import { CredentialFormDynamicFields } from './credential-form-dynamic-fields';
import { CredentialFormSettingsPanel } from './credential-form-settings-panel';
import { CredentialManualAccessPanel } from './credential-manual-access-panel';
import { CredentialProviderPicker } from './credential-provider-picker';
import { CredentialAppStoreFields } from './credential-app-store-fields';
import { credentialInheritedAccessSummary } from '@/features/credentials/utils/credential-inherited-access-summary';
import type { useCredentialFormSheet } from '@/features/credentials/hooks/use-credential-form-sheet';

type FormState = ReturnType<typeof useCredentialFormSheet>;

export interface CredentialFormSheetFieldsProps {
  form: FormState;
}

function TypeSelect({
  credentialType,
  onTypeChange,
  isCreate,
}: {
  credentialType: string;
  onTypeChange: (value: string) => void;
  isCreate: boolean;
}) {
  const types = isCreate
    ? CREDENTIAL_TYPES_FOR_CREATE
    : CREDENTIAL_TYPES.filter(
        (t) => t.value !== 'OTHER_SECRET' || credentialType === 'OTHER_SECRET',
      );

  return (
    <div className="grid gap-2">
      <Label>What is stored?</Label>
      <Select value={credentialType} onValueChange={(v) => onTypeChange(v ?? credentialType)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {types.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CredentialFormSheetFields({ form }: CredentialFormSheetFieldsProps) {
  const {
    isCreate,
    credentialId,
    credentialType,
    requestCredentialTypeChange,
    providerId,
    providerName,
    setProviderSelection,
    environment,
    setEnvironment,
    login,
    setLogin,
    password,
    setPassword,
    apiKey,
    setApiKey,
    phone,
    setPhone,
    url,
    setUrl,
    envData,
    setEnvData,
    comment,
    setComment,
    accessLevel,
    manualGrants,
    setManualGrants,
    detail,
    revealed,
    requestSecretAction,
    showSettings,
    criticality,
    setCriticality,
    nextRotationAt,
    setNextRotationAt,
    appStorePlatform,
    setAppStorePlatform,
  } = form;

  const providerBlock = showsProviderPicker(credentialType) ? (
    <CredentialProviderPicker
      credentialType={credentialType}
      providerId={providerId}
      providerName={providerName}
      onChange={setProviderSelection}
    />
  ) : null;

  const typeBlock = (
    <TypeSelect
      credentialType={credentialType}
      onTypeChange={requestCredentialTypeChange}
      isCreate={isCreate}
    />
  );

  const appStoreBlock =
    credentialType === 'APP_STORE_ACCOUNT' ? (
      <CredentialAppStoreFields
        platform={appStorePlatform}
        onPlatformChange={setAppStorePlatform}
        url={url}
        onUrlChange={setUrl}
      />
    ) : null;

  return (
    <div className="space-y-6">
      {isProviderFirstForType(credentialType) ? (
        <>
          {providerBlock}
          {typeBlock}
        </>
      ) : (
        <>
          {typeBlock}
          {providerBlock}
        </>
      )}

      <div className="grid gap-2">
        <Label htmlFor="cred-environment">Environment</Label>
        <Input
          id="cred-environment"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          placeholder="Production, Staging…"
        />
      </div>

      {appStoreBlock}

      <CredentialFormDynamicFields
        credentialType={credentialType}
        credentialId={credentialId}
        login={login}
        onLoginChange={setLogin}
        password={password}
        onPasswordChange={setPassword}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        phone={phone}
        onPhoneChange={setPhone}
        url={url}
        onUrlChange={setUrl}
        envData={envData}
        onEnvDataChange={setEnvData}
        secretsPresent={detail?.secretsPresent}
        revealed={revealed}
        onReveal={(field) => requestSecretAction(field, 'reveal')}
        onCopy={(field) => requestSecretAction(field, 'copy')}
      />

      {credentialType === 'RECOVERY_CODES' ? (
        <div className="grid gap-2">
          <Label htmlFor="cred-comment">{commentLabelForType(credentialType)}</Label>
          <Textarea
            id="cred-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] font-mono text-sm"
            placeholder="One code per line"
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="cred-comment">{commentLabelForType(credentialType)}</Label>
          <Textarea
            id="cred-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] text-sm"
            placeholder="Private notes (encrypted)"
          />
        </div>
      )}

      {isCreate && accessLevel === 'SECRET' && (
        <CredentialManualAccessPanel
          grants={manualGrants}
          inheritedSummary={credentialInheritedAccessSummary(accessLevel, detail)}
          onGrantsChange={setManualGrants}
        />
      )}

      {!isCreate && showSettings && (
        <CredentialFormSettingsPanel
          criticality={criticality}
          onCriticalityChange={setCriticality}
          nextRotationAt={nextRotationAt}
          onNextRotationAtChange={setNextRotationAt}
        />
      )}
    </div>
  );
}
