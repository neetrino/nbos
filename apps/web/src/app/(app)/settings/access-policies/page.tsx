'use client';

import { useCallback, useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHero, PageHeroTabs, type PageHeroTabOption } from '@/components/shared';
import { RoleAccessPoliciesPanel } from '@/features/platform-access/components/RoleAccessPoliciesPanel';
import { PersonalAccessOverridesPanel } from '@/features/platform-access/components/PersonalAccessOverridesPanel';

type AccessPolicyTab = 'role' | 'personal';

const TAB_OPTIONS: PageHeroTabOption<AccessPolicyTab>[] = [
  { value: 'role', label: 'Role access levels' },
  { value: 'personal', label: 'Personal access levels' },
];

interface RoleItem {
  id: string;
  name: string;
  _count?: { employees: number };
}

export default function AccessPoliciesPage() {
  const [tab, setTab] = useState<AccessPolicyTab>('role');
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await api.get<RoleItem[]>('/api/roles').then((r) => r.data);
      setRoles(Array.isArray(data) ? data : []);
      setRolesError(null);
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Access policies"
        trailing={
          <PageHeroTabs
            ariaLabel="Access policy sections"
            options={TAB_OPTIONS}
            value={tab}
            onChange={setTab}
          />
        }
      />
      <p className="text-muted-foreground text-sm">
        Platform access foundation — role defaults and per-employee overrides for
        project/product-scoped modules (Credentials, Drive, Finance, Project Hub, Tasks).
      </p>

      {tab === 'role' ? (
        <RoleAccessPoliciesPanel
          roles={roles}
          loadingRoles={loadingRoles}
          rolesError={rolesError}
          onRetryRoles={() => void fetchRoles()}
        />
      ) : (
        <PersonalAccessOverridesPanel />
      )}

      {roles.length === 0 && !loadingRoles && !rolesError && tab === 'role' && (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Layers size={14} aria-hidden />
          Configure technical RBAC under Permissions / RBAC, then set access levels here.
        </p>
      )}
    </div>
  );
}
