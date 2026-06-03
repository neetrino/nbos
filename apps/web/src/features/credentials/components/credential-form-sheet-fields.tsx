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
  commentLabelForType,
  showsProviderPicker,
} from '@/features/credentials/credential-field-config';
import { CredentialFormDynamicFields } from './credential-form-dynamic-fields';
import { CredentialFormSettingsPanel } from './credential-form-settings-panel';
import { CredentialManualAccessPanel } from './credential-manual-access-panel';
import { CredentialProviderPicker } from './credential-provider-picker';
import { credentialInheritedAccessSummary } from '@/features/credentials/utils/credential-inherited-access-summary';
import type { useCredentialFormSheet } from '@/features/credentials/hooks/use-credential-form-sheet';

type FormState = ReturnType<typeof useCredentialFormSheet>;

export interface CredentialFormSheetFieldsProps {
  form: FormState;
}

export function CredentialFormSheetFields({ form }: CredentialFormSheetFieldsProps) {
  const {
    isCreate,
    credentialId,
    category,
    setCategory,
    credentialType,
    setCredentialType,
    categoryOptions,
    categoryLocked,
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
  } = form;

  return (
    <div className="space-y-6">
      {!categoryLocked && (
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2">
        <Label>What is stored?</Label>
        <Select
          value={credentialType}
          onValueChange={(v) => setCredentialType(v ?? credentialType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREDENTIAL_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showsProviderPicker(credentialType) ? (
        <CredentialProviderPicker
          credentialType={credentialType}
          providerId={providerId}
          providerName={providerName}
          onChange={setProviderSelection}
        />
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="cred-environment">Environment</Label>
        <Input
          id="cred-environment"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          placeholder="Production, Staging…"
        />
      </div>

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
