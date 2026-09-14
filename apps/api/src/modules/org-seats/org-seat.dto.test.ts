import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateOrgSeatDto, UpdateOrgSeatDto } from './org-seat.dto';

const DEPARTMENT_ID = '10c0184e-108a-43d1-aac7-257458068e98';
const ROLE_UUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

async function validateCreate(input: object) {
  return validate(plainToInstance(CreateOrgSeatDto, input));
}

describe('CreateOrgSeatDto', () => {
  it('accepts a legacy slug permission role id', async () => {
    expect(
      await validateCreate({
        departmentId: DEPARTMENT_ID,
        title: 'Seller',
        defaultPermissionRoleId: 'role-seller',
      }),
    ).toEqual([]);
  });

  it('accepts a UUID permission role id and a cleared mapping', async () => {
    expect(
      await validateCreate({
        departmentId: DEPARTMENT_ID,
        title: 'Seller',
        defaultPermissionRoleId: ROLE_UUID,
      }),
    ).toEqual([]);
    expect(
      await validateCreate({
        departmentId: DEPARTMENT_ID,
        title: 'Unmapped',
        defaultPermissionRoleId: null,
      }),
    ).toEqual([]);
  });
});

describe('UpdateOrgSeatDto', () => {
  it('accepts clearing or mapping a slug permission role', async () => {
    expect(
      await validate(plainToInstance(UpdateOrgSeatDto, { defaultPermissionRoleId: null })),
    ).toEqual([]);
    expect(
      await validate(plainToInstance(UpdateOrgSeatDto, { defaultPermissionRoleId: 'role-seller' })),
    ).toEqual([]);
  });
});
