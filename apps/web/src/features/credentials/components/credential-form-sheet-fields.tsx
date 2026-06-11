'use client';

import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREDENTIAL_TYPES } from '@/features/credentials/constants/credentials';
import { CredentialFormFieldLabel } from '@/features/credentials/components/credential-form-field-label';
import {
  CREDENTIAL_COMMENT_ICON,
  CREDENTIAL_FOLDER_ICON,
  credentialTypeIcon,
} from '@/features/credentials/utils/credential-vault-card-meta';
import {
  CREDENTIAL_TYPES_FOR_CREATE,
  commentLabelForType,
  showsProviderPicker,
} from '@/features/credentials/credential-field-config';
import { formatCredentialTypeLabel } from '@/features/credentials/utils/credential-type-display';
import { CredentialFormDynamicFields } from './credential-form-dynamic-fields';
import { CredentialFormSettingsPanel } from './credential-form-settings-panel';
import { CredentialProviderPicker } from './credential-provider-picker';
import { CredentialAppStoreFields } from './credential-app-store-fields';
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
  const types = isCreate ? CREDENTIAL_TYPES_FOR_CREATE : CREDENTIAL_TYPES;
  const TypeIcon = credentialTypeIcon(credentialType);

  return (
    <div className="grid gap-2">
      <CredentialFormFieldLabel label="What is stored?" icon={TypeIcon} />
      <Select value={credentialType} onValueChange={(v) => onTypeChange(v ?? credentialType)}>
        <SelectTrigger>
          <SelectValue placeholder="Select type">
            {(value: string | null) => (value ? formatCredentialTypeLabel(value) : null)}
          </SelectValue>
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
    login,
    setLogin,
    password,
    setPassword,
    apiKey,
    setApiKey,
    phones,
    setPhones,
    passphrase,
    setPassphrase,
    url,
    setUrl,
    envData,
    setEnvData,
    envSnap,
    comment,
    setComment,
    detail,
    revealed,
    requestSecretAction,
    copySecretField,
    downloadEnvBundle,
    showSettings,
    criticality,
    setCriticality,
    nextRotationAt,
    setNextRotationAt,
    appStorePlatform,
    setAppStorePlatform,
    folderId,
    setFolderId,
    folderOptions,
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
        phones={phones}
        onPhonesChange={setPhones}
      />
    ) : null;

  return (
    <form className="space-y-6" autoComplete="off" onSubmit={(e) => e.preventDefault()} noValidate>
      {typeBlock}
      {providerBlock}

      {folderOptions.length > 0 ? (
        <div className="grid gap-2">
          <CredentialFormFieldLabel label="Folder" icon={CREDENTIAL_FOLDER_ICON} />
          <Select
            value={folderId ?? 'none'}
            onValueChange={(value) => setFolderId(value && value !== 'none' ? value : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="No folder">
                {(value: string | null) => {
                  if (!value || value === 'none') return 'No folder';
                  return folderOptions.find((folder) => folder.id === value)?.name ?? 'Folder';
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder</SelectItem>
              {folderOptions.map((folder) => {
                const FolderIcon = CREDENTIAL_FOLDER_ICON;
                return (
                  <SelectItem key={folder.id} value={folder.id}>
                    <FolderIcon className="size-3.5" aria-hidden />
                    {folder.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : null}

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
        passphrase={passphrase}
        onPassphraseChange={setPassphrase}
        url={url}
        onUrlChange={setUrl}
        envData={envData}
        onEnvDataChange={setEnvData}
        envSnap={envSnap}
        secretsPresent={detail?.secretsPresent}
        revealed={revealed}
        onReveal={(field) => requestSecretAction(field, 'reveal')}
        onCopy={(field) => copySecretField(field)}
        onDownloadEnvBundle={downloadEnvBundle}
      />

      {credentialType === 'RECOVERY_CODES' ? (
        <div className="grid gap-2">
          <CredentialFormFieldLabel
            htmlFor="cred-comment"
            label={commentLabelForType(credentialType)}
            icon={CREDENTIAL_COMMENT_ICON}
          />
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
          <CredentialFormFieldLabel
            htmlFor="cred-comment"
            label={commentLabelForType(credentialType)}
            icon={CREDENTIAL_COMMENT_ICON}
          />
          <Textarea
            id="cred-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] text-sm"
            placeholder="Private notes (encrypted)"
          />
        </div>
      )}

      {!isCreate && showSettings && (
        <CredentialFormSettingsPanel
          criticality={criticality}
          onCriticalityChange={setCriticality}
          nextRotationAt={nextRotationAt}
          onNextRotationAtChange={setNextRotationAt}
        />
      )}
    </form>
  );
}
