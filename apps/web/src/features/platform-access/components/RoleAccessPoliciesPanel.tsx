'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, Shield } from 'lucide-react';
import type { AccessScopeMode, PlatformAccessAction } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PermissionGate } from '@/lib/permissions';
import { platformAccessApi, type RoleAccessPolicyRow } from '@/lib/api/platform-access';
import {
  ACCESS_POLICY_FAMILIES,
  ACCESS_POLICY_LEVEL_OPTIONS,
  ACCESS_POLICY_SCOPE_OPTIONS,
  formatResourceFamilyLabel,
} from '../constants';
import { AccessPolicyChangeReasonDialog } from './AccessPolicyChangeReasonDialog';
import {
  buildRolePolicyDraft,
  isRiskyRolePolicyChange,
  type RolePolicyDraft,
} from '../utils/access-policy-risk';

interface RoleItem {
  id: string;
  name: string;
  _count?: { employees: number };
}

interface RoleAccessPoliciesPanelProps {
  roles: RoleItem[];
  loadingRoles: boolean;
  rolesError: string | null;
  onRetryRoles: () => void;
}

export function RoleAccessPoliciesPanel({
  roles,
  loadingRoles,
  rolesError,
  onRetryRoles,
}: RoleAccessPoliciesPanelProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<RoleAccessPolicyRow[]>([]);
  const [draft, setDraft] = useState<RolePolicyDraft | null>(null);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const loadPolicies = useCallback(async (roleId: string) => {
    setLoadingPolicies(true);
    setPolicyError(null);
    try {
      const res = await platformAccessApi.listRolePolicies(roleId);
      const rows = res.data;
      setBaseline(rows);
      setDraft(buildRolePolicyDraft(rows));
    } catch (err) {
      setPolicyError(err instanceof Error ? err.message : 'Failed to load policies');
      setDraft(null);
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    void loadPolicies(selectedRoleId);
  }, [selectedRoleId, loadPolicies]);

  const persistSave = async (changeReason: string | null) => {
    if (!selectedRoleId || !draft) return;
    setSaving(true);
    try {
      const policies = ACCESS_POLICY_FAMILIES.map((family) => ({
        resourceFamily: family,
        defaultLevel: draft[family].defaultLevel,
        scopeMode: draft[family].scopeMode,
      }));
      const res = await platformAccessApi.saveRolePolicies(selectedRoleId, policies, changeReason);
      setBaseline(res.data);
      setDraft(buildRolePolicyDraft(res.data));
      toast.success('Role access levels saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!selectedRoleId || !draft) return;
    if (isRiskyRolePolicyChange(baseline, draft)) {
      setReasonDialogOpen(true);
      return;
    }
    void persistSave(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {rolesError ? (
        <ErrorState description={rolesError} onRetry={onRetryRoles} />
      ) : loadingRoles ? (
        <LoadingState count={3} />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No roles"
          description="Create roles in Permissions / RBAC first."
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Button
              key={role.id}
              type="button"
              size="sm"
              variant={selectedRoleId === role.id ? 'default' : 'outline'}
              onClick={() => setSelectedRoleId(role.id)}
            >
              {role.name}
              <span className="text-muted-foreground ml-1 text-xs">
                ({role._count?.employees ?? 0})
              </span>
            </Button>
          ))}
        </div>
      )}

      {selectedRole && draft && (
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              Default access by seat for{' '}
              <span className="text-foreground font-medium">{selectedRole.name}</span>. Affects{' '}
              {selectedRole._count?.employees ?? 0} employees unless personal override applies.
            </p>
            <PermissionGate module="COMPANY" action="EDIT">
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void handleSaveClick()}
              >
                <Save size={16} aria-hidden />
                Save
              </Button>
            </PermissionGate>
          </div>
          {policyError ? (
            <ErrorState
              description={policyError}
              onRetry={() => void loadPolicies(selectedRole.id)}
            />
          ) : loadingPolicies ? (
            <LoadingState count={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource family</TableHead>
                  <TableHead className="w-36">Default level</TableHead>
                  <TableHead className="w-36">Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ACCESS_POLICY_FAMILIES.map((family) => (
                  <TableRow key={family}>
                    <TableCell className="font-medium">
                      {formatResourceFamilyLabel(family)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={draft[family].defaultLevel}
                        onValueChange={(v) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  [family]: {
                                    ...prev[family],
                                    defaultLevel: v as PlatformAccessAction,
                                  },
                                }
                              : prev,
                          )
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESS_POLICY_LEVEL_OPTIONS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={draft[family].scopeMode}
                        onValueChange={(v) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  [family]: {
                                    ...prev[family],
                                    scopeMode: v as AccessScopeMode,
                                  },
                                }
                              : prev,
                          )
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESS_POLICY_SCOPE_OPTIONS.map((scope) => (
                            <SelectItem key={scope} value={scope}>
                              {scope}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <AccessPolicyChangeReasonDialog
        open={reasonDialogOpen}
        title="Confirm role access change"
        description="This update reduces access or sets scope to NONE for at least one resource family. Enter a reason for the audit log."
        confirmLabel="Save changes"
        onOpenChange={setReasonDialogOpen}
        onConfirm={(reason) => void persistSave(reason)}
      />
    </div>
  );
}
