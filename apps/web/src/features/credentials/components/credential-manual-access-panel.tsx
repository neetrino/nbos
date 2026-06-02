'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { CredentialManualGrant } from '@/lib/api/credentials';
import type { Employee } from '@/lib/api/employees';

export interface CredentialManualAccessPanelProps {
  grants: CredentialManualGrant[];
  employees: Employee[];
  loading: boolean;
  saving: boolean;
  inheritedSummary: string;
  onGrantsChange: (grants: CredentialManualGrant[]) => void;
  onSave: () => void;
  showSave?: boolean;
}

export function CredentialManualAccessPanel({
  grants,
  employees,
  loading,
  saving,
  inheritedSummary,
  onGrantsChange,
  onSave,
  showSave = true,
}: CredentialManualAccessPanelProps) {
  const grantIds = new Set(grants.map((g) => g.employeeId));
  const addable = employees.filter((e) => !grantIds.has(e.id));

  const addEmployee = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;
    onGrantsChange([
      ...grants,
      {
        employeeId: emp.id,
        level: 'VIEW',
        employee: {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
        },
        grantedAt: new Date().toISOString(),
        grantedBy: null,
      },
    ]);
  };

  const updateLevel = (employeeId: string, level: 'VIEW' | 'EDIT') => {
    onGrantsChange(grants.map((g) => (g.employeeId === employeeId ? { ...g, level } : g)));
  };

  const removeGrant = (employeeId: string) => {
    onGrantsChange(grants.filter((g) => g.employeeId !== employeeId));
  };

  return (
    <section className="border-border grid gap-3 border-t pt-5" aria-label="Manual access">
      <div>
        <h3 className="text-sm font-medium">Manual access</h3>
        <p className="text-muted-foreground mt-1 text-xs">{inheritedSummary}</p>
      </div>

      {loading ? (
        <Skeleton className="h-20 w-full rounded-lg" />
      ) : (
        <div className="grid gap-2">
          {grants.length === 0 ? (
            <p className="text-muted-foreground text-xs">No manual grants yet.</p>
          ) : (
            grants.map((grant) => (
              <div
                key={grant.employeeId}
                className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm">
                  {grant.employee.firstName} {grant.employee.lastName}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <Select
                    value={grant.level}
                    onValueChange={(v) => {
                      if (v === 'VIEW' || v === 'EDIT') updateLevel(grant.employeeId, v);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[5.5rem] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEW">View</SelectItem>
                      <SelectItem value="EDIT">Edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Remove manual access"
                    onClick={() => removeGrant(grant.employeeId)}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {addable.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-0 flex-1 gap-1">
            <Label className="text-xs">Add employee</Label>
            <Select onValueChange={(id) => id && addEmployee(id)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {addable.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {showSave ? (
        <Button type="button" size="sm" disabled={saving || loading} onClick={() => void onSave()}>
          {saving ? 'Saving…' : 'Save manual access'}
        </Button>
      ) : null}
    </section>
  );
}
