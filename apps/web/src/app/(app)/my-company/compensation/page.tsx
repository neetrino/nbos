'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, ShieldCheck, Users } from 'lucide-react';
import { PageHero, StatusBadge } from '@/components/shared';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { CompensationProfileWorkspace } from '@/features/my-company/compensation/compensation-profile-workspace';
import { bonusesApi, type SalesBonusPolicyRow } from '@/lib/api/bonus';

function fullName(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export default function CompensationPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salesPolicies, setSalesPolicies] = useState<SalesBonusPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [employeeResp, policyRows] = await Promise.all([
          employeesApi.getAll({ page: 1, pageSize: 500 }),
          bonusesApi.getSalesPolicies(),
        ]);
        setEmployees(employeeResp.items);
        setSalesPolicies(policyRows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const withBaseSalary = useMemo(
    () => employees.filter((employee) => employee.baseSalary && employee.baseSalary !== '0'),
    [employees],
  );
  const activePolicyCount = useMemo(
    () => salesPolicies.filter((row) => row.isActive).length,
    [salesPolicies],
  );

  return (
    <div className="space-y-6">
      <PageHero title="Compensation" />
      <p className="text-muted-foreground text-sm">
        Compensation profiles runtime view: base salary coverage, active sales bonus policies, and
        links to payroll controls.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <Users size={16} />
            Employees
          </div>
          <p className="text-foreground text-2xl font-semibold">{employees.length}</p>
          <p className="text-muted-foreground text-xs">All active records in Team registry</p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <CircleDollarSign size={16} />
            Base salary configured
          </div>
          <p className="text-foreground text-2xl font-semibold">{withBaseSalary.length}</p>
          <p className="text-muted-foreground text-xs">Employees with non-zero `baseSalary`</p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <ShieldCheck size={16} />
            Active sales rate rows
          </div>
          <p className="text-foreground text-2xl font-semibold">{activePolicyCount}</p>
          <p className="text-muted-foreground text-xs">
            Rows in sales_bonus_policies with isActive
          </p>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge label="Runtime slice" variant="blue" />
          <p className="text-muted-foreground text-sm">
            Version history and policy overrides remain deeper phases; this screen is now connected
            to live employee/policy data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/my-company/team"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Open Team
          </Link>
          <Link
            href="/my-company/sales-bonus-policies"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Open Sales Bonus Policies
          </Link>
          <Link
            href="/my-company/kpi-policies"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            KPI gate policies
          </Link>
          <Link
            href="/finance/payroll"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Open Payroll
          </Link>
        </div>
      </div>

      <CompensationProfileWorkspace employees={employees} />

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Team registry (base salary on employee)</h2>
          {loading ? <span className="text-muted-foreground text-xs">Loading…</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Employee</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Role / Level</th>
                <th className="px-4 py-2 text-left">Base salary</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-border border-t">
                  <td className="px-4 py-2">{fullName(employee)}</td>
                  <td className="px-4 py-2">{employee.departments[0]?.department.name ?? '—'}</td>
                  <td className="px-4 py-2">
                    {employee.role.name}
                    {employee.level ? ` / ${employee.level}` : ''}
                  </td>
                  <td className="px-4 py-2">{employee.baseSalary ?? '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge
                      label={employee.status}
                      variant={employee.status === 'ACTIVE' ? 'green' : 'gray'}
                    />
                  </td>
                </tr>
              ))}
              {!loading && employees.length === 0 ? (
                <tr>
                  <td className="text-muted-foreground px-4 py-6 text-center" colSpan={5}>
                    No employee records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
