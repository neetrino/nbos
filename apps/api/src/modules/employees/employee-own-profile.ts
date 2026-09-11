import type { Prisma } from '@nbos/database';
import type { UpdateOwnProfileDto } from './dto/update-own-profile.dto';

function optionalTrimmedOrNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

/** Maps a self-profile PATCH body to Prisma update data. Empty contact fields clear. */
export function buildOwnProfileUpdateData(body: UpdateOwnProfileDto): Prisma.EmployeeUpdateInput {
  const data: Prisma.EmployeeUpdateInput = {};
  if (body.firstName !== undefined) data.firstName = body.firstName.trim();
  if (body.lastName !== undefined) data.lastName = body.lastName.trim();
  if (body.phone !== undefined) data.phone = optionalTrimmedOrNull(body.phone);
  if (body.telegram !== undefined) data.telegram = optionalTrimmedOrNull(body.telegram);
  if (body.sipId !== undefined) data.sipId = optionalTrimmedOrNull(body.sipId);
  if (body.avatar !== undefined) data.avatar = optionalTrimmedOrNull(body.avatar);
  if (body.birthday !== undefined) {
    data.birthday = body.birthday ? new Date(body.birthday) : null;
  }
  return data;
}
