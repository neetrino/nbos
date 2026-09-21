import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-errors';
import { ZERO_UNITS_CONFIRMATION_MESSAGE } from './delivery-norms.constants';
import {
  isZeroUnitsConfirmationError,
  needsZeroUnitsPublishConfirmation,
  publishWithZeroUnitsConfirmation,
} from './publish-zero-units';
import type { DeliveryRoleUnitInput } from '@nbos/shared';

const SIX_REQUIRED: DeliveryRoleUnitInput[] = [
  { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '10' },
  { roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '10' },
  { roleKey: 'PM', unitKind: 'REQUIRED', units: '10' },
  { roleKey: 'DESIGNER', unitKind: 'REQUIRED', units: '10' },
  { roleKey: 'QA', unitKind: 'REQUIRED', units: '10' },
  { roleKey: 'TECHNICAL_SPECIALIST', unitKind: 'REQUIRED', units: '10' },
];

function withZeroBackend(): DeliveryRoleUnitInput[] {
  return SIX_REQUIRED.map((row) => (row.roleKey === 'BACKEND' ? { ...row, units: '0' } : row));
}

describe('publish-zero-units', () => {
  it('does not treat null units as an explicit zero', () => {
    const rows = SIX_REQUIRED.map((row) =>
      row.roleKey === 'BACKEND' ? { ...row, units: null } : row,
    );
    expect(needsZeroUnitsPublishConfirmation(rows)).toBe(false);
    expect(needsZeroUnitsPublishConfirmation(withZeroBackend())).toBe(true);
  });

  it('recognizes the server confirmation code', () => {
    expect(
      isZeroUnitsConfirmationError(
        new ApiError(ZERO_UNITS_CONFIRMATION_MESSAGE, {
          message: ZERO_UNITS_CONFIRMATION_MESSAGE,
        }),
      ),
    ).toBe(true);
    expect(isZeroUnitsConfirmationError(new ApiError('rate is invalid'))).toBe(false);
  });

  it('asks for confirmation and resends with the flag when required', async () => {
    const publish = vi.fn(async (confirmZeroUnits: boolean) => confirmZeroUnits);
    const result = await publishWithZeroUnitsConfirmation(
      withZeroBackend(),
      'confirm zeros',
      publish,
      () => true,
    );
    expect(result).toBe(true);
    expect(publish).toHaveBeenCalledWith(true);
  });

  it('retries after the server confirmation error', async () => {
    const publish = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(ZERO_UNITS_CONFIRMATION_MESSAGE))
      .mockResolvedValueOnce('published');
    const result = await publishWithZeroUnitsConfirmation(
      SIX_REQUIRED,
      'confirm zeros',
      publish,
      () => true,
    );
    expect(result).toBe('published');
    expect(publish).toHaveBeenNthCalledWith(1, false);
    expect(publish).toHaveBeenNthCalledWith(2, true);
  });
});
