'use client';

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
import { CredentialManualAccessGrantRow } from './credential-manual-access-grant-row';
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
        expiresAt: null,
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

  const patchGrant = (employeeId: string, patch: Partial<CredentialManualGrant>) => {
    onGrantsChange(grants.map((g) => (g.employeeId === employeeId ? { ...g, ...patch } : g)));
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
              <CredentialManualAccessGrantRow
                key={grant.employeeId}
                grant={grant}
                onLevelChange={(employeeId, level) => patchGrant(employeeId, { level })}
                onExpiresAtChange={(employeeId, expiresAt) => patchGrant(employeeId, { expiresAt })}
                onRemove={(employeeId) =>
                  onGrantsChange(grants.filter((g) => g.employeeId !== employeeId))
                }
              />
            ))
          )}
        </div>
      )}

      {addable.length > 0 && (
        <div className="grid min-w-0 gap-1">
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
      )}

      {showSave ? (
        <Button type="button" size="sm" disabled={saving || loading} onClick={() => void onSave()}>
          {saving ? 'Saving…' : 'Save manual access'}
        </Button>
      ) : null}
    </section>
  );
}
