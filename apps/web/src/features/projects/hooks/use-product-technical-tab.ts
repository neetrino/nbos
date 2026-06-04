'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PRODUCT_TECHNICAL_SECTION_DEFAULT,
  type ProductTechnicalSection,
} from '@/features/projects/constants/product-technical-section';
import {
  backupPolicyDraftFromData,
  emptyAssetDraft,
  emptyBackupPolicyDraft,
  emptyDeployDraft,
  emptyEnvironmentDraft,
  emptyProfileDraft,
  profileDraftFromData,
  type TechnicalAssetDraft,
  type TechnicalBackupPolicyDraft,
  type TechnicalDeployDraft,
  type TechnicalEnvironmentDraft,
  type TechnicalProfileDraft,
} from '@/features/projects/components/product-tabs/product-technical-state';
import { technicalApi, type TechnicalProductProfileResponse } from '@/lib/api/technical';

export interface UseProductTechnicalTabResult {
  data: TechnicalProductProfileResponse | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  refetch: () => Promise<void>;
  activeSection: ProductTechnicalSection;
  setActiveSection: (section: ProductTechnicalSection) => void;
  search: string;
  setSearch: (value: string) => void;
  profileDraft: TechnicalProfileDraft;
  setProfileDraft: (draft: TechnicalProfileDraft) => void;
  assetDraft: TechnicalAssetDraft;
  setAssetDraft: (draft: TechnicalAssetDraft) => void;
  envDraft: TechnicalEnvironmentDraft;
  setEnvDraft: (draft: TechnicalEnvironmentDraft) => void;
  deployDraft: TechnicalDeployDraft;
  setDeployDraft: (draft: TechnicalDeployDraft) => void;
  backupDraft: TechnicalBackupPolicyDraft;
  setBackupDraft: (draft: TechnicalBackupPolicyDraft) => void;
  saveProfile: () => Promise<void>;
  createAsset: () => Promise<void>;
  createEnvironment: () => Promise<void>;
  recordDeploy: () => Promise<void>;
  saveBackupPolicy: () => Promise<void>;
}

function parseNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useProductTechnicalTab(
  productId: string,
  enabled: boolean,
): UseProductTechnicalTabResult {
  const [data, setData] = useState<TechnicalProductProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<ProductTechnicalSection>(
    PRODUCT_TECHNICAL_SECTION_DEFAULT,
  );
  const [search, setSearch] = useState('');
  const [profileDraft, setProfileDraft] = useState(emptyProfileDraft);
  const [assetDraft, setAssetDraft] = useState(emptyAssetDraft);
  const [envDraft, setEnvDraft] = useState(emptyEnvironmentDraft);
  const [deployDraft, setDeployDraft] = useState(emptyDeployDraft);
  const [backupDraft, setBackupDraft] = useState(() => emptyBackupPolicyDraft());

  const refetch = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await technicalApi.getProductProfile(productId);
      setData(next);
      setProfileDraft(profileDraftFromData(next));
      setBackupDraft(backupPolicyDraftFromData(next));
    } catch {
      setError('Technical profile could not be loaded.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (enabled) {
      void refetch();
    }
  }, [enabled, refetch]);

  const handleSectionChange = useCallback((section: ProductTechnicalSection) => {
    setActiveSection(section);
    setSearch('');
  }, []);

  const saveProfile = useCallback(async () => {
    if (!productId) return;
    setSaving(true);
    try {
      const next = await technicalApi.updateProfile(productId, profileDraft);
      setData(next);
      setProfileDraft(profileDraftFromData(next));
    } finally {
      setSaving(false);
    }
  }, [productId, profileDraft]);

  const createAsset = useCallback(async () => {
    if (!productId || !assetDraft.name.trim()) return;
    setSaving(true);
    try {
      const next = await technicalApi.createAsset(productId, assetDraft);
      setData(next);
      setAssetDraft(emptyAssetDraft());
    } finally {
      setSaving(false);
    }
  }, [assetDraft, productId]);

  const createEnvironment = useCallback(async () => {
    if (!productId || !envDraft.name.trim()) return;
    setSaving(true);
    try {
      const next = await technicalApi.createEnvironment(productId, envDraft);
      setData(next);
      setEnvDraft(emptyEnvironmentDraft());
    } finally {
      setSaving(false);
    }
  }, [envDraft, productId]);

  const recordDeploy = useCallback(async () => {
    if (!productId) return;
    setSaving(true);
    try {
      const next = await technicalApi.recordDeploy(productId, {
        status: deployDraft.status,
        environment: deployDraft.environment,
        version: deployDraft.version.trim() || null,
        notes: deployDraft.notes.trim() || null,
      });
      setData(next);
      setDeployDraft(emptyDeployDraft());
    } finally {
      setSaving(false);
    }
  }, [deployDraft, productId]);

  const saveBackupPolicy = useCallback(async () => {
    if (!productId) return;
    setSaving(true);
    try {
      const next = await technicalApi.updateBackupPolicy(productId, {
        backupStatus: backupDraft.backupStatus,
        policyName: backupDraft.policyName.trim() || null,
        rpoHours: parseNumberOrNull(backupDraft.rpoHours),
        rtoHours: parseNumberOrNull(backupDraft.rtoHours),
        restoreTestCadenceDays: parseNumberOrNull(backupDraft.restoreTestCadenceDays),
        notes: backupDraft.notes.trim() || null,
      });
      setData(next);
      setBackupDraft(backupPolicyDraftFromData(next));
    } finally {
      setSaving(false);
    }
  }, [backupDraft, productId]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      saving,
      refetch,
      activeSection,
      setActiveSection: handleSectionChange,
      search,
      setSearch,
      profileDraft,
      setProfileDraft,
      assetDraft,
      setAssetDraft,
      envDraft,
      setEnvDraft,
      deployDraft,
      setDeployDraft,
      backupDraft,
      setBackupDraft,
      saveProfile,
      createAsset,
      createEnvironment,
      recordDeploy,
      saveBackupPolicy,
    }),
    [
      assetDraft,
      backupDraft,
      createAsset,
      createEnvironment,
      data,
      deployDraft,
      envDraft,
      error,
      handleSectionChange,
      activeSection,
      loading,
      profileDraft,
      recordDeploy,
      refetch,
      saveBackupPolicy,
      saveProfile,
      saving,
      search,
    ],
  );
}
