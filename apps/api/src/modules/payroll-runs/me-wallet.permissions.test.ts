import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { permissionOf } from '../finance/finance-permission-test-support';
import { MeController } from '../employees/me.controller';
import { EmployeeWalletService } from '../employees/employee-wallet.service';

describe('Employee wallet stays outside FINANCE_SALARY', () => {
  it('does not decorate wallet reads with finance salary', () => {
    const getWallet = MeController.prototype.getWallet;
    const monthDetail = MeController.prototype.getWalletSalaryLineMonthDetail;
    expect(permissionOf(getWallet)).toBeUndefined();
    expect(permissionOf(monthDetail)).toBeUndefined();
  });

  it('still scopes month detail to the current employee', async () => {
    const prisma = {
      salaryLine: {
        findUnique: vi.fn().mockResolvedValue({ employeeId: 'other-person' }),
      },
    };
    const service = new EmployeeWalletService(prisma as never);
    await expect(service.getSalaryLineMonthDetail('emp-1', 'guessed-line')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
