import { BadRequestException } from '@nestjs/common';
import { slugifyCredentialProviderName } from '@nbos/shared';
import type { CredentialsRuntime } from './credentials-runtime';

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

export interface CredentialProviderDto {
  id: string;
  name: string;
  slug: string;
  website: string | null;
}

function toProviderDto(row: {
  id: string;
  name: string;
  slug: string;
  website: string | null;
}): CredentialProviderDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    website: row.website,
  };
}

export async function searchCredentialProviders(
  runtime: CredentialsRuntime,
  query: string | undefined,
  limit?: number,
): Promise<CredentialProviderDto[]> {
  const take = Math.min(Math.max(limit ?? DEFAULT_SEARCH_LIMIT, 1), MAX_SEARCH_LIMIT);
  const q = query?.trim();

  const rows = await runtime.prisma.credentialProvider.findMany({
    where: {
      archivedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ name: 'asc' }],
    take,
    select: { id: true, name: true, slug: true, website: true },
  });

  return rows.map(toProviderDto);
}

export async function createCredentialProvider(
  runtime: CredentialsRuntime,
  input: { name: string; website?: string },
  userId: string,
): Promise<CredentialProviderDto> {
  const name = input.name.trim();
  if (name.length < 2) {
    throw new BadRequestException('Provider name must be at least 2 characters');
  }

  const slug = slugifyCredentialProviderName(name);
  const existing = await runtime.prisma.credentialProvider.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, website: true, archivedAt: true },
  });

  if (existing) {
    if (existing.archivedAt) {
      const restored = await runtime.prisma.credentialProvider.update({
        where: { id: existing.id },
        data: { archivedAt: null, name, website: input.website?.trim() || undefined },
        select: { id: true, name: true, slug: true, website: true },
      });
      return toProviderDto(restored);
    }
    return toProviderDto(existing);
  }

  const created = await runtime.prisma.credentialProvider.create({
    data: {
      name,
      slug,
      website: input.website?.trim() || undefined,
      isSeeded: false,
    },
    select: { id: true, name: true, slug: true, website: true },
  });

  await runtime.auditService.log({
    entityType: 'credential_provider',
    entityId: created.id,
    action: 'credential_provider.create',
    userId,
    changes: { name, slug },
  });

  return toProviderDto(created);
}
