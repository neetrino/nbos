import type { Prisma } from '@nbos/database';
import type { UpdateCredentialDto } from './credential-domain.types';
import { nullableDate } from './credential-date.utils';

export function detectChangedCredentialFields(
  data: UpdateCredentialDto,
  existing: Record<string, unknown>,
): string[] {
  return Object.keys(data).filter((key) => {
    const newVal = data[key as keyof UpdateCredentialDto];
    return newVal !== undefined && newVal !== existing[key];
  });
}

export function buildCredentialUpdateData(
  data: UpdateCredentialDto,
  encrypted: Record<string, string | undefined | null>,
): Prisma.CredentialUpdateInput {
  return {
    ...(data.projectId !== undefined && { projectId: data.projectId }),
    ...(data.productId !== undefined && { productId: data.productId }),
    ...(data.domainId !== undefined && { domainId: data.domainId }),
    ...(data.clientServiceRecordId !== undefined && {
      clientServiceRecordId: data.clientServiceRecordId,
    }),
    ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
    ...(data.category && { category: data.category as Prisma.CredentialUpdateInput['category'] }),
    ...(data.credentialType && {
      credentialType: data.credentialType as Prisma.CredentialUpdateInput['credentialType'],
    }),
    ...(data.criticality && {
      criticality: data.criticality as Prisma.CredentialUpdateInput['criticality'],
    }),
    ...(data.environment !== undefined && { environment: data.environment }),
    ...(data.providerId !== undefined && {
      providerId: data.providerId,
    }),
    ...(data.name && { name: data.name }),
    ...(data.url !== undefined && { url: data.url }),
    ...(data.login !== undefined && { login: data.login }),
    ...(data.password !== undefined && { password: encrypted.password }),
    ...(data.passphrase !== undefined && { passphrase: encrypted.passphrase }),
    ...(data.apiKey !== undefined && { apiKey: encrypted.apiKey }),
    ...(data.envData !== undefined && { envData: encrypted.envData }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.phones !== undefined && { phones: data.phones }),
    ...(data.appStorePlatform !== undefined && {
      appStorePlatform: data.appStorePlatform as Prisma.CredentialUpdateInput['appStorePlatform'],
    }),
    ...(data.notes !== undefined && { notes: data.notes, publicNotes: data.notes }),
    ...(data.publicNotes !== undefined && {
      notes: data.publicNotes,
      publicNotes: data.publicNotes,
    }),
    ...(data.secureNotes !== undefined && { secureNotes: encrypted.secureNotes }),
    ...(data.lastRotatedAt !== undefined && { lastRotatedAt: nullableDate(data.lastRotatedAt) }),
    ...(data.nextRotationAt !== undefined && {
      nextRotationAt: nullableDate(data.nextRotationAt),
    }),
    ...(data.rotationOwnerId !== undefined && { rotationOwnerId: data.rotationOwnerId }),
    ...(data.accessLevel && {
      accessLevel: data.accessLevel as Prisma.CredentialUpdateInput['accessLevel'],
    }),
    ...(data.allowedEmployees && { allowedEmployees: data.allowedEmployees }),
  };
}
