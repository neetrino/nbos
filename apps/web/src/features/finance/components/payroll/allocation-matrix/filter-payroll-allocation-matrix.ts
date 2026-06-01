import type { PayrollAllocationMatrix } from '@/lib/api/payroll-allocation-matrix';

function matchesQuery(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query);
}

function employeeLabel(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

/**
 * Narrows the matrix to a project/order and linked employees, or an employee and coworkers
 * on the same delivery units.
 */
export function filterPayrollAllocationMatrix(
  matrix: PayrollAllocationMatrix,
  search: string,
): PayrollAllocationMatrix {
  const query = search.trim().toLowerCase();
  if (!query) {
    return matrix;
  }

  const employeeIds = new Set<string>();
  const orderIds = new Set<string>();

  for (const employee of matrix.employees) {
    const label = employeeLabel(employee);
    if (
      matchesQuery(label, query) ||
      (employee.position != null && matchesQuery(employee.position, query))
    ) {
      employeeIds.add(employee.employeeId);
    }
  }

  for (const unit of matrix.deliveryUnits) {
    if (
      matchesQuery(unit.label, query) ||
      matchesQuery(unit.projectCode, query) ||
      matchesQuery(unit.orderCode, query)
    ) {
      orderIds.add(unit.orderId);
    }
  }

  for (const employeeId of [...employeeIds]) {
    for (const cell of matrix.cells) {
      if (cell.employeeId === employeeId) {
        orderIds.add(cell.orderId);
      }
    }
  }

  for (const orderId of [...orderIds]) {
    for (const cell of matrix.cells) {
      if (cell.orderId === orderId) {
        employeeIds.add(cell.employeeId);
      }
    }
  }

  if (employeeIds.size === 0 && orderIds.size === 0) {
    return {
      ...matrix,
      employees: [],
      deliveryUnits: [],
      cells: [],
      layout: {
        ...matrix.layout,
        rowOrder: [],
        columnOrder: [],
        pinnedUnitIds: matrix.layout.pinnedUnitIds.filter((id) => orderIds.has(id)),
      },
    };
  }

  const employees = matrix.employees.filter((e) => employeeIds.has(e.employeeId));
  const deliveryUnits = matrix.deliveryUnits.filter((u) => orderIds.has(u.orderId));
  const cells = matrix.cells.filter(
    (c) => employeeIds.has(c.employeeId) && orderIds.has(c.orderId),
  );

  const employeeIdSet = new Set(employees.map((e) => e.employeeId));
  const orderIdSet = new Set(deliveryUnits.map((u) => u.orderId));

  return {
    ...matrix,
    employees,
    deliveryUnits,
    cells,
    layout: {
      ...matrix.layout,
      rowOrder: matrix.layout.rowOrder.filter((id) => employeeIdSet.has(id) || orderIdSet.has(id)),
      columnOrder: matrix.layout.columnOrder.filter(
        (id) => employeeIdSet.has(id) || orderIdSet.has(id),
      ),
      pinnedUnitIds: matrix.layout.pinnedUnitIds.filter((id) => orderIdSet.has(id)),
    },
  };
}
