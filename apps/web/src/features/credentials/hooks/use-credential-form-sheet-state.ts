'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CREDENTIAL_CATEGORIES,
  CREDENTIAL_TYPES,
} from '@/features/credentials/constants/credentials';
import {
  inferAppStorePlatformFromUrl,
  urlForAppStorePlatform,
  type AppStorePlatform,
} from '@/features/credentials/constants/credential-app-store-platform';
import {
  classifyCredentialTypeChange,
  clearCredentialDraftForTypeChange,
} from '@/features/credentials/utils/credential-type-change-policy';
import {
  categoriesForVaultScope,
  defaultCategoryForVaultScope,
} from '@/features/credentials/constants/credential-vault-categories';
import { accessLevelForVaultScope } from '@/features/credentials/vault-scope';
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
    onOpenChange,
    credentialId = null,
    vaultScope = 'project',
    initialName,
    initialCategory,
    allowedCategories,
    initialCredentialType,
    presetKey = '',
  } = props;

  const isCreate = !credentialId;
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SERVICE');
  const [credentialType, setCredentialType] = useState('LOGIN_PASSWORD');
  const [criticality, setCriticality] = useState('MEDIUM');
  const [environment, setEnvironment] = useState('');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [envData, setEnvData] = useState('');
  const [comment, setComment] = useState('');
  const [accessLevel, setAccessLevel] = useState('PROJECT_TEAM');
  const [nextRotationAt, setNextRotationAt] = useState('');
  const [manualGrants, setManualGrants] = useState<CredentialManualGrant[]>([]);
  const [detail, setDetail] = useState<CredentialDetail | null>(null);
  const [revealed, setRevealed] = useState<Partial<Record<CredentialSecretField, string>>>({});
  const [stepUpField, setStepUpField] = useState<CredentialSecretField | null>(null);
  const [stepUpMode, setStepUpMode] = useState<'reveal' | 'copy'>('reveal');
  const [accessDenied, setAccessDenied] = useState(false);
  const [snap, setSnap] = useState('');
  const [appStorePlatform, setAppStorePlatform] = useState<AppStorePlatform>('APPLE');
  const [pendingTypeChange, setPendingTypeChange] = useState<string | null>(null);

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

  const resetCreate = useCallback(() => {
    setName(initialName ?? '');
    setCategory(defaultCategoryForVaultScope(vaultScope, initialCategory, allowedCategories));
    setCredentialType(initialCredentialType ?? 'LOGIN_PASSWORD');
    setCriticality('MEDIUM');
    setEnvironment('');
    setProviderId(null);
    setProviderName('');
    setUrl('');
    setLogin('');
    setPhone('');
    setPassword('');
    setApiKey('');
    setEnvData('');
    setComment('');
    setNextRotationAt('');
    setManualGrants([]);
    setAccessLevel(accessLevelForVaultScope(vaultScope) ?? 'PROJECT_TEAM');
    setDetail(null);
    setRevealed({});
    setAppStorePlatform('APPLE');
    setPendingTypeChange(null);
  }, [allowedCategories, initialCategory, initialCredentialType, initialName, vaultScope]);

  const draftClearHandlers = useMemo(
    () => ({
      setLogin,
      setPassword,
      setApiKey,
      setEnvData,
      setUrl,
      setPhone,
    }),
    [],
  );

  const applyCredentialType = useCallback((nextType: string) => {
    setCredentialType(nextType);
    if (nextType === 'APP_STORE_ACCOUNT') {
      setAppStorePlatform('APPLE');
      setUrl(urlForAppStorePlatform('APPLE'));
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
        applyCredentialType(nextType);
        return;
      }
      setPendingTypeChange(nextType);
    },
    [applyCredentialType, credentialType, detail?.secretsPresent, draftClearHandlers, isCreate],
  );

  const confirmPendingTypeChange = useCallback(() => {
    if (!pendingTypeChange) return;
    applyCredentialType(pendingTypeChange);
    setPendingTypeChange(null);
  }, [applyCredentialType, pendingTypeChange]);

  const applyFormSnapshot = useCallback(
    (fields: {
      name: string;
      category: string;
      credentialType: string;
      criticality: string;
      environment: string;
      providerId: string | null;
      url: string;
      login: string;
      phone: string;
      comment: string;
      nextRotationAt: string;
      manualGrants: CredentialManualGrant[];
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
      environment,
      providerId,
      url,
      login,
      phone,
      comment,
      nextRotationAt,
      manualGrants,
    });
  }, [
    applyFormSnapshot,
    name,
    category,
    credentialType,
    criticality,
    environment,
    providerId,
    url,
    login,
    phone,
    comment,
    nextRotationAt,
    manualGrants,
  ]);

  const captureFormRollback = useCallback((): (() => void) => {
    const saved: CredentialFormRollbackState = {
      name,
      category,
      credentialType,
      criticality,
      environment,
      providerId,
      providerName,
      url,
      login,
      phone,
      comment,
      nextRotationAt,
      accessLevel,
      password,
      apiKey,
      envData,
      snap,
      manualGrants: manualGrants.map((g) => ({
        ...g,
        employee: { ...g.employee },
      })),
    };
    return () => {
      setName(saved.name);
      setCategory(saved.category);
      setCredentialType(saved.credentialType);
      setCriticality(saved.criticality);
      setEnvironment(saved.environment);
      setProviderId(saved.providerId);
      setProviderName(saved.providerName);
      setUrl(saved.url);
      setLogin(saved.login);
      setPhone(saved.phone);
      setComment(saved.comment);
      setNextRotationAt(saved.nextRotationAt);
      setAccessLevel(saved.accessLevel);
      setPassword(saved.password);
      setApiKey(saved.apiKey);
      setEnvData(saved.envData);
      setManualGrants(saved.manualGrants);
      setSnap(saved.snap);
    };
  }, [
    accessLevel,
    apiKey,
    category,
    comment,
    credentialType,
    criticality,
    envData,
    environment,
    login,
    manualGrants,
    name,
    nextRotationAt,
    password,
    phone,
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
      setEnvironment(d.environment ?? '');
      setProviderId(d.providerId ?? null);
      setProviderName(d.provider ?? '');
      const loadedUrl = d.url ?? '';
      setUrl(loadedUrl);
      if (d.credentialType === 'APP_STORE_ACCOUNT') {
        setAppStorePlatform(inferAppStorePlatformFromUrl(loadedUrl));
      }
      setLogin(d.login ?? '');
      setPhone(d.phone ?? '');
      setPassword('');
      setApiKey('');
      setEnvData('');
      setComment(d.comment ?? '');
      setAccessLevel(d.accessLevel);
      const rotationDate = d.nextRotationAt?.slice(0, 10) ?? '';
      setNextRotationAt(rotationDate);
      setManualGrants(grants);
      setRevealed({});
      applyFormSnapshot({
        name: d.name,
        category: d.category,
        credentialType: d.credentialType,
        criticality: d.criticality,
        environment: d.environment ?? '',
        providerId: d.providerId ?? null,
        url: d.url ?? '',
        login: d.login ?? '',
        phone: d.phone ?? '',
        comment: d.comment ?? '',
        nextRotationAt: rotationDate,
        manualGrants: grants,
      });
    },
    [applyFormSnapshot],
  );

  const loadDetail = useCallback(async () => {
    if (!credentialId) return;
    setLoading(true);
    setAccessDenied(false);
    try {
      const [detailRow, manual] = await Promise.all([
        credentialsApi.getById(credentialId),
        credentialsApi.getManualAccess(credentialId),
      ]);
      applyDetail(detailRow, manual.grants);
    } catch {
      setAccessDenied(true);
      toast.error('No access to this credential');
    } finally {
      setLoading(false);
    }
  }, [applyDetail, credentialId]);

  const prevOpenRef = useRef(false);
  const prevPresetRef = useRef(presetKey);
  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      setShowSettings(false);
      setAccessDenied(false);
      return;
    }
    const opening = !prevOpenRef.current;
    const presetChanged = prevPresetRef.current !== presetKey;
    if (opening || presetChanged) {
      if (isCreate) resetCreate();
      else void loadDetail();
    }
    prevOpenRef.current = true;
    prevPresetRef.current = presetKey;
  }, [open, presetKey, isCreate, resetCreate, loadDetail]);

  const dirty = isCreate
    ? name.trim().length > 0 || manualGrants.length > 0
    : buildCredentialFormSnap({
        name,
        category,
        credentialType,
        comment,
        environment,
        providerId,
        url,
        login,
        phone,
        criticality,
        nextRotationAt,
        manualGrants,
      }) !== snap || Boolean(password || apiKey || envData);

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
    environment,
    setEnvironment,
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
    phone,
    setPhone,
    password,
    setPassword,
    apiKey,
    setApiKey,
    envData,
    setEnvData,
    comment,
    setComment,
    accessLevel,
    nextRotationAt,
    setNextRotationAt,
    manualGrants,
    setManualGrants,
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
    commitFormSnapshot,
    captureFormRollback,
    accessDenied,
    setAccessDenied,
  };
}
