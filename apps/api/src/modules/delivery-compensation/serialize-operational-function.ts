import { assertNoFinancialLeak, type DeliveryFunctionOperationalDto } from '@nbos/shared';

export type CatalogFunctionRecord = {
  id: string;
  code: string;
  category: string;
  iconKey: string;
  status: string;
  contentVersions: Array<{
    version: number;
    title: string;
    summary: string;
    scopeBoundaries: string;
    instructions: string;
    acceptanceCriteria: string;
    publishedAt: Date | null;
    attachments: Array<{
      id: string;
      fileAssetId: string;
      caption: string | null;
      sortOrder: number;
    }>;
  }>;
  tiers?: Array<{ id: string; code: string; label: string; position: number }>;
};

function pickContent(record: CatalogFunctionRecord) {
  const published = record.contentVersions.find((row) => row.publishedAt !== null);
  return published ?? record.contentVersions[0] ?? null;
}

export type CatalogCardRecord = {
  id: string;
  code: string;
  category: string;
  iconKey: string;
  status: string;
  contentVersions: Array<{
    version: number;
    title: string;
    summary: string;
    publishedAt: Date | null;
  }>;
  tiers?: Array<{ id: string; code: string; label: string; position: number }>;
};

export function serializeOperationalFunction(
  record: CatalogFunctionRecord,
): DeliveryFunctionOperationalDto {
  const content = pickContent(record);
  return sealOperationalDto({
    ...cardFields(record, content),
    scopeBoundaries: content?.scopeBoundaries ?? '',
    instructions: content?.instructions ?? '',
    acceptanceCriteria: content?.acceptanceCriteria ?? '',
    attachments: (content?.attachments ?? []).map((row) => ({
      id: row.id,
      fileAssetId: row.fileAssetId,
      caption: row.caption,
      sortOrder: row.sortOrder,
    })),
  });
}

/** List/browse payload: card-visible fields only. Open `get(id)` for full copy. */
export function serializeCardFunction(record: CatalogCardRecord): DeliveryFunctionOperationalDto {
  const content =
    record.contentVersions.find((row) => row.publishedAt !== null) ??
    record.contentVersions[0] ??
    null;
  return sealOperationalDto({
    ...cardFields(record, content),
    scopeBoundaries: '',
    instructions: '',
    acceptanceCriteria: '',
    attachments: [],
  });
}

function cardFields(
  record: CatalogCardRecord,
  content: { title: string; summary: string; version: number } | null,
): Pick<
  DeliveryFunctionOperationalDto,
  | 'id'
  | 'code'
  | 'category'
  | 'iconKey'
  | 'status'
  | 'title'
  | 'summary'
  | 'contentVersion'
  | 'tiers'
> {
  return {
    id: record.id,
    code: record.code,
    category: record.category,
    iconKey: record.iconKey,
    status: record.status,
    title: content?.title ?? record.code,
    summary: content?.summary ?? '',
    contentVersion: content?.version ?? null,
    tiers: [...(record.tiers ?? [])]
      .sort((left, right) => left.position - right.position)
      .map((tier) => ({
        id: tier.id,
        code: tier.code,
        label: tier.label,
        position: tier.position,
      })),
  };
}

function sealOperationalDto(dto: DeliveryFunctionOperationalDto): DeliveryFunctionOperationalDto {
  const leaks = assertNoFinancialLeak(dto);
  if (leaks.length > 0) {
    throw new Error(`Operational catalog DTO leaked financial keys: ${leaks.join(', ')}`);
  }
  return dto;
}
