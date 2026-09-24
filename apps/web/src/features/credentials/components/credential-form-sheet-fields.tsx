'use client';

import { KeyRound, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetSection } from '@/components/shared';
import { DETAIL_SHEET_SECTION_BODY_CLASS } from '@/components/shared/detail-sheet-classes';
import { credentialCategoryMessageKey } from '@/features/credentials/constants/credentials';
import { CredentialFormFieldLabel } from '@/features/credentials/components/credential-form-field-label';
import { CREDENTIAL_FOLDER_ICON } from '@/features/credentials/utils/credential-vault-card-meta';
import {
  commentLabelMessageKey,
  showsProviderPicker,
} from '@/features/credentials/credential-field-config';
import { CredentialFormDynamicFields } from './credential-form-dynamic-fields';
import { CredentialFormCommentField } from './credential-form-comment-field';
import { CredentialFormContextLinks } from './credential-form-context-links';
import { CredentialFormSettingsPanel } from './credential-form-settings-panel';
import { CredentialProviderPicker } from './credential-provider-picker';
import { CredentialAppStoreFields } from './credential-app-store-fields';
import { CredentialFolderTreePicker } from '@/features/credentials/components/credential-folder-tree-picker';
import { CredentialFormCategoryCombobox } from '@/features/credentials/components/credential-form-category-combobox';
import type { useCredentialFormSheet } from '@/features/credentials/hooks/use-credential-form-sheet';

type FormState = ReturnType<typeof useCredentialFormSheet>;

export interface CredentialFormSheetFieldsProps {
  form: FormState;
}

export function CredentialFormSheetFields({ form }: CredentialFormSheetFieldsProps) {
  const {
    isCreate,
    credentialId,
    credentialType,
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
    category,
    requestCategoryChange,
    categoryOptions,
    categoryLocked,
    categoryLabel,
    contextLinks,
  } = form;
  const t = useTranslations('credentials');
  const translatedCategoryOptions = categoryOptions.map((option) => {
    const key = credentialCategoryMessageKey(option.value);
    return { ...option, label: key ? t(key as never) : option.label };
  });
  const translatedCategoryKey = credentialCategoryMessageKey(
    category === 'OTHER' ? 'SERVICE' : category,
  );
  const translatedCategoryLabel = translatedCategoryKey
    ? t(translatedCategoryKey as never)
    : categoryLabel;
  const commentKey = commentLabelMessageKey(credentialType);
  const hasCategory = category.length > 0;
  const commentPlaceholder =
    credentialType === 'RECOVERY_CODES'
      ? t('form.recoveryPlaceholder')
      : t('form.commentPlaceholder');
  const commentClass =
    credentialType === 'RECOVERY_CODES' ? 'min-h-[120px] font-mono text-sm' : 'text-sm';

  return (
    <form
      className="flex flex-col gap-4"
      autoComplete="off"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      <DetailSheetSection title={t('form.sectionCredential')} icon={<KeyRound size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <CredentialFormCategoryCombobox
            category={category}
            categoryLabel={translatedCategoryLabel}
            categoryOptions={translatedCategoryOptions}
            categoryLocked={categoryLocked}
            invalid={isCreate && !hasCategory}
            onCategoryChange={requestCategoryChange}
          />
          {folderOptions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <CredentialFormFieldLabel label={t('form.folder')} icon={CREDENTIAL_FOLDER_ICON} />
                <CredentialFolderTreePicker
                  folders={folderOptions}
                  value={folderId}
                  onChange={setFolderId}
                />
              </div>
            </div>
          ) : null}
          {hasCategory && showsProviderPicker(credentialType) ? (
            <CredentialProviderPicker
              credentialType={credentialType}
              providerId={providerId}
              providerName={providerName}
              onChange={setProviderSelection}
              labelStyle="outlined"
            />
          ) : null}
          {hasCategory && credentialType === 'APP_STORE_ACCOUNT' ? (
            <CredentialAppStoreFields
              platform={appStorePlatform}
              onPlatformChange={setAppStorePlatform}
              url={url}
              onUrlChange={setUrl}
              phones={phones}
              onPhonesChange={setPhones}
            />
          ) : null}
          {hasCategory ? (
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
          ) : null}
        </div>
      </DetailSheetSection>

      {hasCategory ? (
        <CredentialFormCommentField
          id="cred-comment"
          label={t(commentKey)}
          value={comment}
          onChange={setComment}
          placeholder={commentPlaceholder}
          className={commentClass}
        />
      ) : null}

      {!isCreate && showSettings ? (
        <DetailSheetSection title={t('form.sectionSettings')} icon={<Settings size={12} />}>
          <CredentialFormSettingsPanel
            criticality={criticality}
            onCriticalityChange={setCriticality}
            nextRotationAt={nextRotationAt}
            onNextRotationAtChange={setNextRotationAt}
          />
        </DetailSheetSection>
      ) : null}

      <CredentialFormContextLinks {...contextLinks} />
    </form>
  );
}
