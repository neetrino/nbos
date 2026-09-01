import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmployeeGeneralDraft } from './employee-general-form-state';

const updateProfile = vi.fn();
const getEmployee = vi.fn();
const update = vi.fn();
const changeRole = vi.fn();
const getById = vi.fn();

vi.mock('@/lib/api/me', () => ({
  meApi: {
    updateProfile: (...args: unknown[]) => updateProfile(...args),
    getEmployee: (...args: unknown[]) => getEmployee(...args),
  },
}));

vi.mock('@/lib/api/employees', () => ({
  employeesApi: {
    update: (...args: unknown[]) => update(...args),
    changeRole: (...args: unknown[]) => changeRole(...args),
    getById: (...args: unknown[]) => getById(...args),
  },
}));

import { persistEmployeeGeneral } from './persist-employee-general';

function draft(partial: Partial<EmployeeGeneralDraft> = {}): EmployeeGeneralDraft {
  return {
    firstName: 'Anna',
    lastName: 'Petrosyan',
    email: 'anna@neetrino.com',
    phone: '+374',
    telegram: '@anna',
    sipId: '1001',
    position: 'Developer',
    level: 'MIDDLE',
    notes: '',
    hireDate: '2024-01-01',
    birthday: '1994-03-12',
    status: 'ACTIVE',
    roleId: 'role-1',
    ...partial,
  };
}

describe('persistEmployeeGeneral', () => {
  beforeEach(() => {
    updateProfile.mockReset();
    getEmployee.mockReset();
    update.mockReset();
    changeRole.mockReset();
    getById.mockReset();
  });

  it('saves self-service fields through /me/profile without COMPANY edit', async () => {
    getEmployee.mockResolvedValue({ id: 'emp-1' });
    await persistEmployeeGeneral({
      employeeId: 'emp-1',
      selfProfile: true,
      canEditCompany: false,
      snap: draft(),
      draft: draft({ phone: '+37499' }),
    });
    expect(updateProfile).toHaveBeenCalledWith({ phone: '+37499' });
    expect(update).not.toHaveBeenCalled();
    expect(getEmployee).toHaveBeenCalledTimes(1);
  });

  it('uses the HR employee API when COMPANY edit is present', async () => {
    update.mockResolvedValue({ id: 'emp-1' });
    getById.mockResolvedValue({ id: 'emp-1' });
    await persistEmployeeGeneral({
      employeeId: 'emp-1',
      selfProfile: false,
      canEditCompany: true,
      snap: draft(),
      draft: draft({ phone: '+37499' }),
    });
    expect(update).toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
    expect(getById).toHaveBeenCalledWith('emp-1');
  });
});
