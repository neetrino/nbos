'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2, User } from 'lucide-react';
import type { AccessScopeMode, PlatformAccessAction, PlatformResourceFamily } from '@nbos/shared';
import { employeesApi } from '@/lib/api/employees';
import { Button } from '@/components/ui/button';
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
import { ACCESS_POLICY_FAMILIES, formatResourceFamilyLabel } from '../constants';
import { AccessPolicyChangeReasonDialog } from './AccessPolicyChangeReasonDialog';
import { PersonalAccessOverrideAddForm } from './PersonalAccessOverrideAddForm';
import { isRiskyPersonalOverride, isValidChangeReason } from '../utils/access-policy-risk';

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
  const [pendingRemoveFamily, setPendingRemoveFamily] = useState<PlatformResourceFamily | null>(
    null,
  );

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

  const persistAddOverride = async (reason: string) => {
    if (!selectedEmployeeId) return;
    setSaving(true);
    try {
      await platformAccessApi.upsertEmployeeOverride(selectedEmployeeId, {
        resourceFamily: addFamily,
        level: addLevel,
        scopeMode: addScope,
        reason,
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

  const handleAddOverride = () => {
    if (!selectedEmployeeId) {
      toast.error('Select an employee first');
      return;
    }
    const reason = addReason.trim();
    if (isRiskyPersonalOverride(addLevel, addScope)) {
      if (!isValidChangeReason(reason)) {
        toast.error('Enter a change reason (at least 3 characters) for this override');
        return;
      }
      void persistAddOverride(reason);
      return;
    }
    void persistAddOverride(reason || 'Routine personal access adjustment');
  };

  const handleRemove = (family: PlatformResourceFamily) => {
    setPendingRemoveFamily(family);
  };

  const confirmRemove = async (reason: string) => {
    if (!selectedEmployeeId || !pendingRemoveFamily) return;
    try {
      await platformAccessApi.removeEmployeeOverride(
        selectedEmployeeId,
        pendingRemoveFamily,
        reason,
      );
      toast.success('Override removed');
      await fetchOverrides(selectedEmployeeId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setPendingRemoveFamily(null);
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
            <PersonalAccessOverrideAddForm
              addFamily={addFamily}
              addLevel={addLevel}
              addScope={addScope}
              addReason={addReason}
              availableFamilies={availableFamilies}
              saving={saving}
              onFamilyChange={setAddFamily}
              onLevelChange={setAddLevel}
              onScopeChange={setAddScope}
              onReasonChange={setAddReason}
              onSubmit={() => void handleAddOverride()}
            />
          </PermissionGate>
        </>
      )}

      <AccessPolicyChangeReasonDialog
        open={pendingRemoveFamily !== null}
        title="Remove personal override"
        description="Removing an override changes effective access for this employee. Enter a reason for the audit log."
        confirmLabel="Remove override"
        onOpenChange={(open) => {
          if (!open) setPendingRemoveFamily(null);
        }}
        onConfirm={(reason) => void confirmRemove(reason)}
      />
    </div>
  );
}
