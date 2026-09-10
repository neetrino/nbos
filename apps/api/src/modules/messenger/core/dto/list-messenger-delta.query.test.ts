import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListMessengerDeltaQueryDto } from './list-messenger-delta.query';

async function validateQuery(input: object) {
  return validate(plainToInstance(ListMessengerDeltaQueryDto, input));
}

function propertyErrors(errors: Awaited<ReturnType<typeof validate>>, property: string) {
  return errors.filter((error) => error.property === property);
}

describe('ListMessengerDeltaQueryDto', () => {
  it('accepts a non-negative decimal checkpoint', async () => {
    expect(await validateQuery({ after: '0' })).toEqual([]);
    expect(await validateQuery({ after: '12', cursor: undefined })).toEqual([]);
  });

  it('rejects malformed, negative, and huge revision or cursor values at the boundary', async () => {
    expect(propertyErrors(await validateQuery({ after: '-1' }), 'after').length).toBeGreaterThan(0);
    expect(propertyErrors(await validateQuery({ after: '1e2' }), 'after').length).toBeGreaterThan(0);
    expect(propertyErrors(await validateQuery({ after: '01' }), 'after').length).toBeGreaterThan(0);
    expect(
      propertyErrors(await validateQuery({ after: `${'9'.repeat(21)}` }), 'after').length,
    ).toBeGreaterThan(0);
    expect(
      propertyErrors(
        await validateQuery({ after: '0', cursor: 'x'.repeat(181) }),
        'cursor',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      propertyErrors(await validateQuery({ after: '0', authorizationEpoch: 'zz' }), 'authorizationEpoch')
        .length,
    ).toBeGreaterThan(0);
  });
});
