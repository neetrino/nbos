import { BadRequestException } from '@nestjs/common';
import {
  type FileAssetTypeEnum,
  type FilePurposeEnum,
  type FileVisibilityEnum,
  type FileConfidentialityEnum,
  type FileLinkTypeEnum,
} from '@nbos/database';
import type { CreateFileAssetDto, CreateFileLinkDto } from './drive.types';

export function buildInitialVersion(
  data: Pick<CreateFileAssetDto, 'storageKey' | 'createdById' | 'sizeBytes' | 'checksum'>,
) {
  return {
    versionNumber: 1,
    storageKey: data.storageKey,
    uploadedById: data.createdById,
    sizeBytes: data.sizeBytes,
    checksum: data.checksum,
    isCurrent: true,
  };
}

export function buildLinkCreateInput(data: CreateFileLinkDto) {
  return {
    entityType: requireText(data.entityType, 'entityType'),
    entityId: requireText(data.entityId, 'entityId'),
    linkType: pickLinkType(data.linkType),
    purposeOverride: pickPurpose(data.purposeOverride),
    isPrimary: data.isPrimary ?? false,
    linkedById: data.linkedById,
  };
}

export function pickFileType(
  input: string | undefined,
  name: string,
  mimeType?: string,
  externalUrl?: string,
) {
  if (input) return input as FileAssetTypeEnum;
  if (externalUrl) return 'LINK';
  if (mimeType?.startsWith('image/')) return 'IMAGE';
  if (mimeType?.startsWith('video/')) return 'VIDEO';
  if (mimeType?.startsWith('audio/')) return 'AUDIO';

  const extension = name.split('.').pop()?.toLowerCase();
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension ?? '')) return 'DOCUMENT';
  if (['xls', 'xlsx', 'csv'].includes(extension ?? '')) return 'SPREADSHEET';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension ?? '')) return 'ARCHIVE';
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html', 'sql'].includes(extension ?? ''))
    return 'CODE';
  return 'OTHER';
}

export function pickPurpose(input?: string) {
  return input ? (input as FilePurposeEnum) : undefined;
}

export function pickVisibility(input?: string) {
  return (input as FileVisibilityEnum | undefined) ?? 'INTERNAL';
}

export function pickConfidentiality(input?: string) {
  return (input as FileConfidentialityEnum | undefined) ?? 'CONFIDENTIAL';
}

export function pickLinkType(input?: string) {
  return (input as FileLinkTypeEnum | undefined) ?? 'ATTACHMENT';
}

export function requireText(value: string | undefined, field: string) {
  const trimmed = value?.trim();
  if (!trimmed) throw new BadRequestException(`${field} is required.`);
  return trimmed;
}
