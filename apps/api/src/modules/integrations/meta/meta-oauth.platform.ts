import { BadRequestException } from '@nestjs/common';

export type MetaOAuthPlatform = 'FACEBOOK' | 'INSTAGRAM';

const META_OAUTH_PLATFORMS: readonly MetaOAuthPlatform[] = ['FACEBOOK', 'INSTAGRAM'];

/** Parses and validates the Meta OAuth platform query param. */
export function parseMetaOAuthPlatform(value: string | undefined): MetaOAuthPlatform {
  if (!value || value.trim().length === 0) {
    throw new BadRequestException(
      'Missing OAuth platform. Use platform=FACEBOOK or platform=INSTAGRAM.',
    );
  }
  const normalized = value.trim().toUpperCase();
  if (META_OAUTH_PLATFORMS.includes(normalized as MetaOAuthPlatform)) {
    return normalized as MetaOAuthPlatform;
  }
  throw new BadRequestException(
    `Invalid OAuth platform "${value}". Allowed values: FACEBOOK, INSTAGRAM.`,
  );
}
