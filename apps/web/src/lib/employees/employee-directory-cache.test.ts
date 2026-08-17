import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAll = vi.fn();

vi.mock('@/lib/api/employees', () => ({
  employeesApi: {
    getAll: (...args: unknown[]) => getAll(...args),
  },
}));

vi.mock('./team-directory-cache', () => ({
  invalidateTeamDirectoryCache: vi.fn(),
}));

import {
  invalidateEmployeePickerEmptyCache,
  searchEmployeesForPicker,
} from './employee-directory-cache';

function employeeRow(id: string, firstName: string, lastName: string, tasksAssigned: number) {
  return {
    id,
    firstName,
    lastName,
    email: `${id}@nbos.test`,
    position: null,
    avatar: null,
    _count: { tasksAssigned, dealsSelling: 0, productsManaging: 0, tasksCreated: 0 },
  };
}

describe('searchEmployeesForPicker', () => {
  beforeEach(() => {
    invalidateEmployeePickerEmptyCache();
    getAll.mockReset();
    getAll.mockResolvedValue({
      items: [
        employeeRow('robert', 'Robert', 'Unused', 0),
        employeeRow('liana', 'Liana', 'Ghazaryan', 9),
        employeeRow('amelia', 'Amelia', 'Smith', 2),
      ],
      meta: { total: 3, page: 1, pageSize: 100, totalPages: 1 },
    });
  });

  it('loads the directory once and filters locally', async () => {
    const first = await searchEmployeesForPicker('lia');
    const second = await searchEmployeesForPicker('rob');

    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      status: 'ACTIVE',
    });
    expect(first.map((row) => row.label)).toEqual(['Liana Ghazaryan', 'Amelia Smith']);
    expect(second.map((row) => row.label)).toEqual(['Robert Unused']);
  });

  it('sorts the open list by usage', async () => {
    const open = await searchEmployeesForPicker('');
    expect(open.map((row) => row.label)).toEqual([
      'Liana Ghazaryan',
      'Amelia Smith',
      'Robert Unused',
    ]);
  });
});
