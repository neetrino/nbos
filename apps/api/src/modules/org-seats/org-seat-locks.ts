import type { TransactionClient } from '@nbos/database';

// All assignment writes take the employee lock first, then the seat lock.
// This also serializes with offboarding and legacy membership edits.
export async function lockSeatEmployee(tx: TransactionClient, employeeId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM employees WHERE id = ${employeeId} FOR UPDATE`;
}

export async function lockOrgSeat(tx: TransactionClient, seatId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM org_seats WHERE id = ${seatId} FOR UPDATE`;
}
