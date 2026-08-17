import { describe, expect, it } from 'vitest';
import {
  employeeUsageScore,
  filterAndRankEmployeePickerPeople,
  type EmployeePickerPerson,
} from './employee-picker-rank';

function person(
  id: string,
  firstName: string,
  lastName: string,
  usageScore: number,
  email = `${id}@nbos.test`,
): EmployeePickerPerson {
  return {
    firstName,
    lastName,
    email,
    usageScore,
    option: { value: id, label: `${firstName} ${lastName}`.trim() },
  };
}

const LIANA = person('liana', 'Liana', 'Ghazaryan', 12);
const AMELIA = person('amelia', 'Amelia', 'Smith', 8);
const ROBERT = person('robert', 'Robert', 'Unused', 0);
const LIA_LAST = person('lia-last', 'Anna', 'Lianova', 3);
const EMAIL_ONLY = person('mail', 'Karen', 'Petrosyan', 20, 'lia.ops@nbos.test');

describe('employeeUsageScore', () => {
  it('sums assignment counts we already load', () => {
    expect(employeeUsageScore({ tasksAssigned: 10, dealsSelling: 2, productsManaging: 1 })).toBe(
      13,
    );
    expect(employeeUsageScore(undefined)).toBe(0);
  });
});

describe('filterAndRankEmployeePickerPeople', () => {
  const directory = [ROBERT, AMELIA, EMAIL_ONLY, LIA_LAST, LIANA];

  it('puts the first-name prefix match first for lia', () => {
    const labels = filterAndRankEmployeePickerPeople(directory, 'lia').map((row) => row.label);
    expect(labels[0]).toBe('Liana Ghazaryan');
    expect(labels).toContain('Amelia Smith');
    expect(labels.indexOf('Liana Ghazaryan')).toBeLessThan(labels.indexOf('Amelia Smith'));
    expect(labels.indexOf('Liana Ghazaryan')).toBeLessThan(labels.indexOf('Anna Lianova'));
  });

  it('ranks email-only matches after name matches', () => {
    const labels = filterAndRankEmployeePickerPeople(directory, 'lia').map((row) => row.label);
    expect(labels.at(-1)).toBe('Karen Petrosyan');
  });

  it('sorts the empty list by usage, not recency', () => {
    const labels = filterAndRankEmployeePickerPeople(directory, '').map((row) => row.label);
    expect(labels[0]).toBe('Karen Petrosyan');
    expect(labels.at(-1)).toBe('Robert Unused');
  });

  it('matches a typed full name prefix', () => {
    const labels = filterAndRankEmployeePickerPeople(directory, 'liana g').map((row) => row.label);
    expect(labels).toEqual(['Liana Ghazaryan']);
  });

  it('is case-insensitive and drops non-matches', () => {
    const labels = filterAndRankEmployeePickerPeople(directory, 'ROB').map((row) => row.label);
    expect(labels).toEqual(['Robert Unused']);
  });
});
