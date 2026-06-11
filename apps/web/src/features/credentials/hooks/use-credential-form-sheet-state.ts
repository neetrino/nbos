'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import {
  inferAppStorePlatformFromUrl,
  urlForAppStorePlatform,
  type AppStorePlatform,
} from '@/features/credentials/constants/credential-app-store-platform';
import {
  classifyCredentialTypeChange,
  clearCredentialDraftForTypeChange,
} from '@/features/credentials/utils/credential-type-change-policy';
import { showsProviderPicker } from '@/features/credentials/credential-field-config';
import { phonesFromCredentialDetail } from '@/features/credentials/utils/credential-phones-normalize';
import {
  categoriesForVaultScope,
  defaultCategoryForVaultScope,
} from '@/features/credentials/constants/credential-vault-categories';
import { accessLevelForVaultScope } from '@/features/credentials/vault-scope';
import { credentialDetailPlaceholderFromListItem } from '@/features/credentials/utils/credential-detail-placeholder';
import {
  credentialsApi,
  type CredentialDetail,
  type CredentialManualGrant,
  type CredentialSecretField,
} from '@/lib/api/credentials';
import {
  buildCredentialFormSnap,
  type CredentialFormRollbackState,
} from '@/features/credentials/utils/credential-form-sheet-snapshot';
import { toast } from 'sonner';
import type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';

export function useCredentialFormSheetState(props: CredentialFormSheetProps) {
  const {
    open,
    credentialId = null,
    initialItem = null,
    vaultScope = 'project',
    initialName,
    initialCategory,
    allowedCategories,
    initialCredentialType,
    initialFolderId,
    presetKey = '',
  } = props;

  const isCreate = !credentialId;
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SERVICE');
  const [credentialType, setCredentialType] = useState('LOGIN_PASSWORD');
  const [criticality, setCriticality] = useState('MEDIUM');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [phones, setPhones] = useState<string[]>(['']);
  const [password, setPassword] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [envData, setEnvData] = useState('');
  /** Baseline ENV serialized form for dirty detection (keys preview / last save). */
  const [envSnap, setEnvSnap] = useState('');
  const [comment, setComment] = useState('');
  const [accessLevel, setAccessLevel] = useState('PROJECT_TEAM');
  const [nextRotationAt, setNextRotationAt] = useState('');
  const [manualGrants, setManualGrants] = useState<CredentialManualGrant[]>([]);
  const [folderId, setFolderId] = useState<string | null>(initialFolderId ?? null);
  const [detail, setDetail] = useState<CredentialDetail | null>(null);
  const [revealed, setRevealed] = useState<Partial<Record<CredentialSecretField, string>>>({});
  const [stepUpField, setStepUpField] = useState<CredentialSecretField | null>(null);
  const [stepUpMode, setStepUpMode] = useState<'reveal' | 'copy'>('reveal');
  const [accessDenied, setAccessDenied] = useState(false);
  const [snap, setSnap] = useState('');
  const [appStorePlatform, setAppStorePlatform] = useState<AppStorePlatform>('APPLE');
  const [pendingTypeChange, setPendingTypeChange] = useState<string | null>(null);
  const [orphanedSecretsAcknowledged, setOrphanedSecretsAcknowledged] = useState(false);
  /** True after full `getById` apply — avoids ENV auto-reveal racing placeholder/background load. */
  const [detailHydrated, setDetailHydrated] = useState(false);

  const categoryOptions = useMemo(() => {
    const scopePool = categoriesForVaultScope(
      vaultScope,
      !isCreate ? category : (initialCategory ?? null),
    );
    if (!allowedCategories?.length) return scopePool;
    const narrowed = scopePool.filter((c) => allowedCategories.includes(c.value));
    return narrowed.length > 0 ? narrowed : scopePool;
  }, [allowedCategories, vaultScope, isCreate, category, initialCategory]);

  const categoryLocked = categoryOptions.length === 1;
  const categoryLabel = CREDENTIAL_CATEGORIES.find((c) => c.value === category)?.label ?? category;
  const folderEditable = (props.folderOptions?.length ?? 0) > 0 || initialFolderId !== undefined;

  const resetCreate = useCallback(() => {
    setName(initialName ?? '');
    setCategory(defaultCategoryForVaultScope(vaultScope, initialCategory, allowedCategories));
    setCredentialType(initialCredentialType ?? 'LOGIN_PASSWORD');
    setCriticality('MEDIUM');
    setProviderId(null);
    setProviderName('');
    setUrl('');
    setLogin('');
    setPhones(['']);
    setPassword('');
    setPassphrase('');
    setApiKey('');
    setEnvData('');
    setEnvSnap('');
    setComment('');
    setNextRotationAt('');
    setManualGrants([]);
    setFolderId(initialFolderId ?? null);
    setAccessLevel(accessLevelForVaultScope(vaultScope) ?? 'PROJECT_TEAM');
    setDetail(null);
    setRevealed({});
    setAppStorePlatform('APPLE');
    setPendingTypeChange(null);
    setOrphanedSecretsAcknowledged(false);
    setDetailHydrated(false);
    setSnap('');
  }, [
    allowedCategories,
    initialCategory,
    initialCredentialType,
    initialFolderId,
    initialName,
    vaultScope,
  ]);

  const draftClearHandlers = useMemo(
    () => ({
      setLogin,
      setPassword,
      setPassphrase,
      setApiKey,
      setEnvData,
      setUrl,
      setPhones: (v: string[]) => setPhones(v.length > 0 ? v : ['']),
      clearProvider: () => {
        setProviderId(null);
        setProviderName('');
      },
    }),
    [],
  );

  const applyCredentialType = useCallback((nextType: string) => {
    setCredentialType(nextType);
    if (!showsProviderPicker(nextType)) {
      setProviderId(null);
      setProviderName('');
    }
    if (nextType === 'APP_STORE_ACCOUNT') {
      const platform: AppStorePlatform = 'APPLE';
      setAppStorePlatform(platform);
      setUrl(urlForAppStorePlatform(platform));
    }
  }, []);

  const requestCredentialTypeChange = useCallback(
    (nextType: string) => {
      if (nextType === credentialType) return;
      if (isCreate) {
        clearCredentialDraftForTypeChange(credentialType, nextType, draftClearHandlers);
        applyCredentialType(nextType);
        return;
      }
      const level = classifyCredentialTypeChange(credentialType, nextType, detail?.secretsPresent);
      if (level === 'green') {
        setOrphanedSecretsAcknowledged(false);
        applyCredentialType(nextType);
        return;
      }
      setOrphanedSecretsAcknowledged(false);
      setPendingTypeChange(nextType);
    },
    [applyCredentialType, credentialType, detail?.secretsPresent, draftClearHandlers, isCreate],
  );

  const confirmPendingTypeChange = useCallback(() => {
    if (!pendingTypeChange) return;
    setOrphanedSecretsAcknowledged(true);
    applyCredentialType(pendingTypeChange);
    setPendingTypeChange(null);
  }, [applyCredentialType, pendingTypeChange]);

  const clearOrphanedSecretsAcknowledged = useCallback(() => {
    setOrphanedSecretsAcknowledged(false);
  }, []);

  const applyFormSnapshot = useCallback(
    (fields: {
      name: string;
      category: string;
      credentialType: string;
      criticality: string;
      providerId: string | null;
      url: string;
      login: string;
      phones: string[];
      appStorePlatform: string;
      comment: string;
      nextRotationAt: string;
      manualGrants: CredentialManualGrant[];
      folderId?: string | null;
    }) => {
      setSnap(buildCredentialFormSnap(fields));
    },
    [],
  );

  const commitFormSnapshot = useCallback(() => {
    applyFormSnapshot({
      name,
      category,
      credentialType,
      criticality,
      providerId,
      url,
      login,
      phones,
      appStorePlatform: credentialType === 'APP_STORE_ACCOUNT' ? appStorePlatform : '',
      comment,
      nextRotationAt,
      manualGrants,
      folderId,
    });
    setEnvSnap(envData.trim());
  }, [
    applyFormSnapshot,
    envData,
    name,
    category,
    credentialType,
    criticality,
    providerId,
    url,
    login,
    phones,
    appStorePlatform,
    comment,
    nextRotationAt,
    manualGrants,
    folderId,
  ]);

  const captureFormRollback = useCallback((): (() => void) => {
    const saved: CredentialFormRollbackState = {
      name,
      category,
      credentialType,
      criticality,
      providerId,
      providerName,
      url,
      login,
      phones,
      appStorePlatform,
      comment,
      nextRotationAt,
      accessLevel,
      password,
      passphrase,
      apiKey,
      envData,
      envSnap,
      snap,
      manualGrants: manualGrants.map((g) => ({
        ...g,
        employee: { ...g.employee },
      })),
      folderId,
    };
    return () => {
      setName(saved.name);
      setCategory(saved.category);
      setCredentialType(saved.credentialType);
      setCriticality(saved.criticality);
      setProviderId(saved.providerId);
      setProviderName(saved.providerName);
      setUrl(saved.url);
      setLogin(saved.login);
      setPhones(saved.phones);
      setAppStorePlatform(saved.appStorePlatform as AppStorePlatform);
      setComment(saved.comment);
      setNextRotationAt(saved.nextRotationAt);
      setAccessLevel(saved.accessLevel);
      setPassword(saved.password);
      setPassphrase(saved.passphrase);
      setApiKey(saved.apiKey);
      setEnvData(saved.envData);
      setEnvSnap(saved.envSnap);
      setManualGrants(saved.manualGrants);
      setSnap(saved.snap);
      setFolderId(saved.folderId);
    };
  }, [
    accessLevel,
    apiKey,
    category,
    comment,
    credentialType,
    criticality,
    envData,
    envSnap,
    login,
    manualGrants,
    folderId,
    name,
    nextRotationAt,
    password,
    phones,
    appStorePlatform,
    passphrase,
    providerId,
    providerName,
    snap,
    url,
  ]);

  const applyDetail = useCallback(
    (d: CredentialDetail, grants: CredentialManualGrant[]) => {
      setDetail(d);
      setName(d.name);
      setCategory(d.category);
      setCredentialType(d.credentialType);
      setCriticality(d.criticality);
      setProviderId(d.providerId ?? null);
      setProviderName(d.provider ?? '');
      const loadedUrl = d.url ?? '';
      setUrl(loadedUrl);
      const platform: AppStorePlatform =
        d.appStorePlatform === 'GOOGLE' || d.appStorePlatform === 'APPLE'
          ? d.appStorePlatform
          : inferAppStorePlatformFromUrl(loadedUrl);
      if (d.credentialType === 'APP_STORE_ACCOUNT') {
        setAppStorePlatform(platform);
      }
      setLogin(d.login ?? '');
      setPhones(phonesFromCredentialDetail(d));
      setPassword('');
      setPassphrase('');
      setApiKey('');
      setEnvData('');
      setEnvSnap('');
      setComment(d.comment ?? '');
      setAccessLevel(d.accessLevel);
      const rotationDate = d.nextRotationAt?.slice(0, 10) ?? '';
      setNextRotationAt(rotationDate);
      setManualGrants(grants);
      const primaryFolder = d.folders?.find((folder) => folder.isPrimary) ?? d.folders?.[0];
      setFolderId(primaryFolder?.id ?? null);
      setRevealed({});
      setOrphanedSecretsAcknowledged(false);
      applyFormSnapshot({
        name: d.name,
        category: d.category,
        credentialType: d.credentialType,
        criticality: d.criticality,
        providerId: d.providerId ?? null,
        url: d.url ?? '',
        login: d.login ?? '',
        phones: phonesFromCredentialDetail(d),
        appStorePlatform: d.credentialType === 'APP_STORE_ACCOUNT' ? platform : '',
        comment: d.comment ?? '',
        nextRotationAt: rotationDate,
        manualGrants: grants,
        folderId: primaryFolder?.id ?? null,
      });
    },
    [applyFormSnapshot],
  );

  const dirtyRef = useRef(false);

  /** Fills server-only fields without clobbering edits made during a background fetch. */
  const mergeServerDetail = useCallback((d: CredentialDetail) => {
    setDetail(d);
    setManualGrants(d.manualGrants ?? []);
    setComment((prev) => (prev.trim().length === 0 ? (d.comment ?? '') : prev));
  }, []);

  const loadDetail = useCallback(
    async (opts?: { background?: boolean }) => {
      if (!credentialId) return;
      if (!opts?.background) setLoading(true);
      setAccessDenied(false);
      setDetailHydrated(false);
      try {
        const detailRow = await credentialsApi.getById(credentialId);
        const preserveInProgressEdits =
          opts?.background && dirtyRef.current && snap !== '' && detail?.id === credentialId;
        if (preserveInProgressEdits) {
          mergeServerDetail(detailRow);
          setDetailHydrated(true);
        } else {
          applyDetail(detailRow, detailRow.manualGrants ?? []);
          setDetailHydrated(true);
        }
      } catch {
        setAccessDenied(true);
        toast.error('No access to this credential');
      } finally {
        setLoading(false);
      }
    },
    [applyDetail, credentialId, detail?.id, mergeServerDetail, snap],
  );

  const promoteAfterCreate = useCallback(
    (created: CredentialDetail) => {
      applyDetail(created, created.manualGrants ?? []);
      setDetailHydrated(true);
      setShowSettings(false);
    },
    [applyDetail],
  );

  const prevOpenRef = useRef(false);
  const prevPresetRef = useRef(presetKey);
  const prevCredentialIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      prevPresetRef.current = presetKey;
      prevCredentialIdRef.current = null;
      setShowSettings(false);
      setAccessDenied(false);
      resetCreate();
      return;
    }

    const opening = !prevOpenRef.current;
    const presetChanged = prevPresetRef.current !== presetKey;
    const credentialChanged = prevCredentialIdRef.current !== credentialId;

    const openExisting = () => {
      if (initialItem && initialItem.id === credentialId) {
        if (detail?.id !== credentialId) {
          setDetailHydrated(false);
          applyDetail(credentialDetailPlaceholderFromListItem(initialItem), []);
        }
        void loadDetail({ background: true });
        return;
      }
      if (detail?.id === credentialId) {
        void loadDetail({ background: true });
        return;
      }
      void loadDetail();
    };

    if (opening || presetChanged) {
      if (!credentialId) {
        resetCreate();
      } else {
        openExisting();
      }
    } else if (credentialChanged && credentialId) {
      openExisting();
    }

    prevOpenRef.current = true;
    prevPresetRef.current = presetKey;
    prevCredentialIdRef.current = credentialId;
  }, [
    open,
    presetKey,
    credentialId,
    initialItem,
    detail?.id,
    resetCreate,
    applyDetail,
    loadDetail,
  ]);

  const dirty = isCreate
    ? name.trim().length > 0 || manualGrants.length > 0
    : snap === ''
      ? false
      : buildCredentialFormSnap({
          name,
          category,
          credentialType,
          comment,
          providerId,
          url,
          login,
          phones,
          appStorePlatform: credentialType === 'APP_STORE_ACCOUNT' ? appStorePlatform : '',
          criticality,
          nextRotationAt,
          manualGrants,
          folderId,
        }) !== snap ||
        Boolean(password || passphrase || apiKey) ||
        (credentialType === 'ENV_BUNDLE' && envData.trim() !== envSnap);

  dirtyRef.current = dirty;

  return {
    isCreate,
    credentialId,
    loading,
    showSettings,
    setShowSettings,
    name,
    setName,
    category,
    setCategory,
    credentialType,
    requestCredentialTypeChange,
    pendingTypeChange,
    setPendingTypeChange,
    confirmPendingTypeChange,
    appStorePlatform,
    setAppStorePlatform,
    criticality,
    setCriticality,
    providerId,
    providerName,
    setProviderSelection: (id: string | null, name: string) => {
      setProviderId(id);
      setProviderName(name);
    },
    url,
    setUrl,
    login,
    setLogin,
    phones,
    setPhones,
    passphrase,
    setPassphrase,
    password,
    setPassword,
    apiKey,
    setApiKey,
    envData,
    setEnvData,
    envSnap,
    setEnvSnap,
    comment,
    setComment,
    accessLevel,
    nextRotationAt,
    setNextRotationAt,
    manualGrants,
    setManualGrants,
    folderId,
    setFolderId,
    folderEditable,
    open,
    detail,
    revealed,
    setRevealed,
    stepUpField,
    setStepUpField,
    stepUpMode,
    setStepUpMode,
    categoryOptions,
    categoryLocked,
    categoryLabel,
    dirty,
    loadDetail,
    promoteAfterCreate,
    commitFormSnapshot,
    captureFormRollback,
    orphanedSecretsAcknowledged,
    clearOrphanedSecretsAcknowledged,
    detailCredentialType: detail?.credentialType ?? null,
    accessDenied,
    setAccessDenied,
    detailHydrated,
  };
}
