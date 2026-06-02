'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import {
  categoriesForVaultScope,
  defaultCategoryForVaultScope,
  isCategoryAllowedInVaultScope,
} from '@/features/credentials/constants/credential-vault-categories';
import { accessLevelForVaultScope } from '@/features/credentials/vault-scope';
import {
  credentialsApi,
  type CredentialDetail,
  type CredentialSecretField,
} from '@/lib/api/credentials';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { toast } from 'sonner';
import type { CredentialFormSheetProps } from './credential-form-sheet-types';

const CREATE_DEFAULT_SUCCESS_TOAST = 'Credential created';

export function useCredentialFormSheet(props: CredentialFormSheetProps) {
  const {
    open,
    onOpenChange,
    credentialId = null,
    vaultScope = 'project',
    projectId,
    productId,
    initialName,
    initialCategory,
    allowedCategories,
    initialCredentialType,
    submitLabel = 'Save',
    successToast,
    presetKey = '',
    onCreated,
    onSaved,
  } = props;

  const isCreate = !credentialId;
  const { creatorId } = useTaskCreatorId();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        credentialType,
        environment: environment.trim() || undefined,
        provider: provider.trim() || undefined,
        url: url.trim() || undefined,
        login: login.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        envData: envData.trim() || undefined,
        secureNotes: comment.trim() || undefined,
        accessLevel,
        allowedEmployees: accessLevel === 'SECRET' ? allowedEmployees : undefined,
      };
      if (isCreate) {
        if (projectId) body.projectId = projectId;
        if (productId) body.productId = productId;
        if (accessLevel === 'PERSONAL' && creatorId) body.ownerId = creatorId;
        const created = await credentialsApi.create(body);
        if (successToast !== false) toast.success(successToast ?? CREATE_DEFAULT_SUCCESS_TOAST);
        onOpenChange(false);
        onCreated?.(created);
        onSaved?.();
      } else if (credentialId) {
        body.criticality = criticality;
        body.nextRotationAt = nextRotationAt || null;
        await credentialsApi.update(credentialId, body);
        toast.success('Credential saved');
        await loadDetail();
        onSaved?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const runStepUp = async (pwd: string) => {
    if (!credentialId || !stepUpField) return;
    try {
      if (stepUpMode === 'reveal') {
        const { value } = await credentialsApi.revealSecret(credentialId, stepUpField, pwd);
        setRevealed((p) => ({ ...p, [stepUpField]: value }));
      } else {
        const { value } = await credentialsApi.copySecret(credentialId, stepUpField, pwd);
        await navigator.clipboard.writeText(value);
        toast.success('Copied');
      }
    } catch {
      toast.error('Step-up failed');
    }
  };

  const toggleAllowedEmployee = (id: string) => {
    setAllowedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  return {
    isCreate,
    credentialId,
    loading,
    saving,
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
    employees,
    toggleAllowedEmployee,
    detail,
    revealed,
    stepUpField,
    setStepUpField,
    stepUpMode,
    setStepUpMode,
    categoryOptions,
    categoryLocked,
    categoryLabel,
    dirty,
    handleSave,
    runStepUp,
    loadDetail,
    submitLabel,
    onOpenChange,
  };
}
