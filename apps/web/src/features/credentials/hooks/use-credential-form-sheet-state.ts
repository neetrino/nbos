'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import {
  categoriesForVaultScope,
  defaultCategoryForVaultScope,
} from '@/features/credentials/constants/credential-vault-categories';
import { accessLevelForVaultScope } from '@/features/credentials/vault-scope';
import {
  credentialsApi,
  type CredentialDetail,
  type CredentialSecretField,
} from '@/lib/api/credentials';
import { employeesApi, type Employee } from '@/lib/api/employees';
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
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [envData, setEnvData] = useState('');
  const [comment, setComment] = useState('');
  const [accessLevel, setAccessLevel] = useState('PROJECT_TEAM');
  const [nextRotationAt, setNextRotationAt] = useState('');
  const [allowedEmployees, setAllowedEmployees] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [detail, setDetail] = useState<CredentialDetail | null>(null);
  const [revealed, setRevealed] = useState<Partial<Record<CredentialSecretField, string>>>({});
  const [stepUpField, setStepUpField] = useState<CredentialSecretField | null>(null);
  const [stepUpMode, setStepUpMode] = useState<'reveal' | 'copy'>('reveal');
  const [snap, setSnap] = useState('');

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
    setProvider('');
    setUrl('');
    setLogin('');
    setPhone('');
    setPassword('');
    setApiKey('');
    setEnvData('');
    setComment('');
    setNextRotationAt('');
    setAllowedEmployees([]);
    setAccessLevel(accessLevelForVaultScope(vaultScope) ?? 'PROJECT_TEAM');
    setDetail(null);
    setRevealed({});
  }, [allowedCategories, initialCategory, initialCredentialType, initialName, vaultScope]);

  const applyDetail = useCallback((d: CredentialDetail) => {
    setDetail(d);
    setName(d.name);
    setCategory(d.category);
    setCredentialType(d.credentialType);
    setCriticality(d.criticality);
    setEnvironment(d.environment ?? '');
    setProvider(d.provider ?? '');
    setUrl(d.url ?? '');
    setLogin(d.login ?? '');
    setPhone(d.phone ?? '');
    setPassword('');
    setApiKey('');
    setEnvData('');
    setComment(d.comment ?? '');
    setAccessLevel(d.accessLevel);
    setNextRotationAt(d.nextRotationAt?.slice(0, 10) ?? '');
    setAllowedEmployees([...d.allowedEmployees]);
    setRevealed({});
    setSnap(
      JSON.stringify({ name: d.name, category: d.category, credentialType: d.credentialType }),
    );
  }, []);

  const loadDetail = useCallback(async () => {
    if (!credentialId) return;
    setLoading(true);
    try {
      applyDetail(await credentialsApi.getById(credentialId));
    } catch {
      toast.error('Failed to load credential');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [applyDetail, credentialId, onOpenChange]);

  const prevOpenRef = useRef(false);
  const prevPresetRef = useRef(presetKey);
  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      setShowSettings(false);
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

  useEffect(() => {
    if (open && accessLevel === 'SECRET') {
      void employeesApi.getAll({ pageSize: 200 }).then((r) => setEmployees(r.items));
    }
  }, [open, accessLevel]);

  const dirty = isCreate
    ? name.trim().length > 0
    : JSON.stringify({ name, category, credentialType, comment }) !== snap ||
      Boolean(password || apiKey || envData);

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
    setCredentialType,
    criticality,
    setCriticality,
    environment,
    setEnvironment,
    provider,
    setProvider,
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
    allowedEmployees,
    setAllowedEmployees,
    employees,
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
  };
}
