'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import type { AccessScopeMode, PlatformAccessAction, PlatformResourceFamily } from '@nbos/shared';
import { employeesApi } from '@/lib/api/employees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { platformAccessApi, type EmployeeAccessOverrideRow } from '@/lib/api/platform-access';
import {
  ACCESS_POLICY_FAMILIES,
  ACCESS_POLICY_LEVEL_OPTIONS,
  ACCESS_POLICY_SCOPE_OPTIONS,
  formatResourceFamilyLabel,
} from '../constants';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function PersonalAccessOverridesPanel() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [overrides, setOverrides] = useState<EmployeeAccessOverrideRow[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [addFamily, setAddFamily] = useState<PlatformResourceFamily>('CREDENTIALS');
  const [addLevel, setAddLevel] = useState<PlatformAccessAction>('VIEW');
  const [addScope, setAddScope] = useState<AccessScopeMode>('ASSIGNED');
  const [addReason, setAddReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const res = await employeesApi.getAll({ pageSize: 200, status: 'ACTIVE' });
      const items = res.items ?? [];
      setEmployees(Array.isArray(items) ? items : []);
      setEmployeeError(null);
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  const fetchOverrides = useCallback(async (employeeId: string) => {
    setLoadingOverrides(true);
    setOverrideError(null);
    try {
      const res = await platformAccessApi.listEmployeeOverrides(employeeId);
      setOverrides(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setOverrideError(err instanceof Error ? err.message : 'Failed to load overrides');
      setOverrides([]);
    } finally {
      setLoadingOverrides(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setOverrides([]);
      return;
    }
    void fetchOverrides(selectedEmployeeId);
  }, [selectedEmployeeId, fetchOverrides]);

  const handleAddOverride = async () => {
    if (!selectedEmployeeId) {
      toast.error('Select an employee first');
      return;
    }
    setSaving(true);
    try {
      await platformAccessApi.upsertEmployeeOverride(selectedEmployeeId, {
        resourceFamily: addFamily,
        level: addLevel,
        scopeMode: addScope,
        reason: addReason.trim() || null,
      });
      toast.success('Override saved');
      setAddReason('');
      await fetchOverrides(selectedEmployeeId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save override');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (family: PlatformResourceFamily) => {
    if (!selectedEmployeeId) return;
    try {
      await platformAccessApi.removeEmployeeOverride(selectedEmployeeId, family);
      toast.success('Override removed');
      await fetchOverrides(selectedEmployeeId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const usedFamilies = new Set(overrides.map((o) => o.resourceFamily));
  const availableFamilies = ACCESS_POLICY_FAMILIES.filter((f) => !usedFamilies.has(f));

  return (
    <div className="flex flex-col gap-4">
      {employeeError ? (
        <ErrorState description={employeeError} onRetry={() => void fetchEmployees()} />
      ) : loadingEmployees ? (
        <LoadingState count={2} />
      ) : (
        <div className="max-w-md">
          <Label htmlFor="employee-select">Employee</Label>
          <Select value={selectedEmployeeId} onValueChange={(v) => setSelectedEmployeeId(v ?? '')}>
            <SelectTrigger id="employee-select" className="mt-1">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!selectedEmployeeId ? (
        <EmptyState
          icon={User}
          title="Select an employee"
          description="Personal access levels override role defaults for one person."
        />
      ) : overrideError ? (
        <ErrorState
          description={overrideError}
          onRetry={() => void fetchOverrides(selectedEmployeeId)}
        />
      ) : loadingOverrides ? (
        <LoadingState count={3} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-sm">
                    No personal overrides — role defaults apply.
                  </TableCell>
                </TableRow>
              ) : (
                overrides.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatResourceFamilyLabel(row.resourceFamily)}</TableCell>
                    <TableCell>{row.level}</TableCell>
                    <TableCell>{row.scopeMode ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.reason ?? '—'}
                    </TableCell>
                    <TableCell>
                      <PermissionGate module="COMPANY" action="EDIT">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove override"
                          onClick={() => void handleRemove(row.resourceFamily)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PermissionGate module="COMPANY" action="EDIT">
            <div className="border-border bg-muted/30 grid gap-3 rounded-xl border p-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label>Resource family</Label>
                <Select
                  value={addFamily}
                  onValueChange={(v) => setAddFamily(v as PlatformResourceFamily)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableFamilies.length > 0
                      ? availableFamilies
                      : ACCESS_POLICY_FAMILIES
                    ).map((family) => (
                      <SelectItem key={family} value={family}>
                        {formatResourceFamilyLabel(family)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select
                  value={addLevel}
                  onValueChange={(v) => setAddLevel(v as PlatformAccessAction)}
                >
                  <SelectTrigger className="mt-1">
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
              </div>
              <div>
                <Label>Scope</Label>
                <Select value={addScope} onValueChange={(v) => setAddScope(v as AccessScopeMode)}>
                  <SelectTrigger className="mt-1">
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
              </div>
              <div className="md:col-span-2">
                <Label>Reason</Label>
                <Input
                  className="mt-1"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  placeholder="Why this override is needed"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" disabled={saving} onClick={() => void handleAddOverride()}>
                  <Plus size={16} aria-hidden />
                  Add / update
                </Button>
              </div>
            </div>
          </PermissionGate>
        </>
      )}
    </div>
  );
}
