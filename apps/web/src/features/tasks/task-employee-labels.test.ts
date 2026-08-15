import { beforeEach, describe, expect, it, vi } from 'vitest';

const getById = vi.fn();
const searchEmployeesForPicker = vi.fn();

vi.mock('@/lib/api/employees', () => ({
  employeesApi: {
    getById: (...args: unknown[]) => getById(...args),
  },
}));

vi.mock('@/lib/employees', () => ({
  searchEmployeesForPicker: (...args: unknown[]) => searchEmployeesForPicker(...args),
}));

import {
  clearEmployeeLabelCache,
  peekEmployeeLabels,
  pickEmployeeLabels,
  rememberEmployeeLabel,
  resolveEmployeeLabelMap,
} from './task-employee-labels';

const KARAM_ID = '14b22deb-5998-4bb5-aaba-f3ad5a0a8ff8';
const JASMINE_ID = 'a68acd1a-b712-4032-9063-57ad9554c3aa';

describe('pickEmployeeLabels', () => {
  it('never falls back to a raw employee id', () => {
    expect(pickEmployeeLabels([KARAM_ID], { [KARAM_ID]: KARAM_ID })).toEqual({});
    expect(pickEmployeeLabels([KARAM_ID], {})).toEqual({});
  });

  it('keeps a real name', () => {
    expect(pickEmployeeLabels([KARAM_ID], { [KARAM_ID]: 'Karo Gabrielyan' })).toEqual({
      [KARAM_ID]: 'Karo Gabrielyan',
    });
  });
});

describe('resolveEmployeeLabelMap', () => {
  beforeEach(() => {
    clearEmployeeLabelCache();
    getById.mockReset();
    searchEmployeesForPicker.mockReset();
    searchEmployeesForPicker.mockResolvedValue([]);
  });

  it('returns a cached name without calling the API', async () => {
    rememberEmployeeLabel(KARAM_ID, 'Karo Gabrielyan');
    const labels = await resolveEmployeeLabelMap([KARAM_ID]);
    expect(labels).toEqual({ [KARAM_ID]: 'Karo Gabrielyan' });
    expect(getById).not.toHaveBeenCalled();
  });

  it('uses the picker first page before getById', async () => {
    searchEmployeesForPicker.mockResolvedValue([{ value: JASMINE_ID, label: 'Jasmine Ghazaryan' }]);
    const labels = await resolveEmployeeLabelMap([JASMINE_ID]);
    expect(labels).toEqual({ [JASMINE_ID]: 'Jasmine Ghazaryan' });
    expect(getById).not.toHaveBeenCalled();
  });

  it('does not store a UUID when getById fails', async () => {
    getById.mockRejectedValue(new Error('not found'));
    const labels = await resolveEmployeeLabelMap([KARAM_ID]);
    expect(labels).toEqual({});
    expect(peekEmployeeLabels([KARAM_ID])).toEqual({});
  });
});
