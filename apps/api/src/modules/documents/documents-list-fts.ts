import { join, sql, type PrismaClient } from '@nbos/database';
import type { DocumentStatusEnum } from '@nbos/database';

/** Escape `%`, `_`, `\` for PostgreSQL `ILIKE ... ESCAPE '\\'`. */
export function escapeDocumentSearchLikePattern(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export interface SearchDocumentsListFtsParams {
  term: string;
  sectionId?: string;
  status?: DocumentStatusEnum;
  includeArchived: boolean;
  limit: number;
}

/**
 * Ranked document ids: full-text on `search_vector` plus the same OR paths as list ILIKE
 * (title, description, plain text, section name, tag names).
 */
export async function searchDocumentIdsForList(
  prisma: InstanceType<typeof PrismaClient>,
  params: SearchDocumentsListFtsParams,
): Promise<Array<{ id: string; rank: number }>> {
  const term = params.term.trim();
  if (!term) return [];

  const pattern = `%${escapeDocumentSearchLikePattern(term)}%`;
  const filters: ReturnType<typeof sql>[] = [];
  if (params.sectionId) {
    filters.push(sql`d.section_id = ${params.sectionId}`);
  }
  if (params.status) {
    filters.push(sql`d.status = ${params.status}::"DocumentStatusEnum"`);
  } else if (!params.includeArchived) {
    filters.push(sql`d.status <> ${'ARCHIVED'}::"DocumentStatusEnum"`);
  }
  const extraAnd = filters.length > 0 ? sql`AND ${join(filters, ' AND ')}` : sql``;

  const rows = await prisma.$queryRaw<Array<{ id: string; rank: number }>>(sql`
    WITH sq AS (SELECT websearch_to_tsquery('english', ${term}) AS tsq)
    SELECT
      d.id,
      (
        CASE
          WHEN d.search_vector @@ sq.tsq THEN ts_rank_cd(d.search_vector, sq.tsq)
          ELSE 0::real
        END
      )::float8 AS rank
    FROM documents d
    INNER JOIN document_sections ds ON ds.id = d.section_id
    CROSS JOIN sq
    WHERE ds.archived_at IS NULL
    ${extraAnd}
    AND (
      d.search_vector @@ sq.tsq
      OR d.title ILIKE ${pattern} ESCAPE '\\'
      OR COALESCE(d.description, '') ILIKE ${pattern} ESCAPE '\\'
      OR COALESCE(d.plain_text, '') ILIKE ${pattern} ESCAPE '\\'
      OR ds.name ILIKE ${pattern} ESCAPE '\\'
      OR EXISTS (
        SELECT 1
        FROM document_tag_links dtl
        INNER JOIN document_tags dt ON dt.id = dtl.tag_id
        WHERE dtl.document_id = d.id AND dt.name ILIKE ${pattern} ESCAPE '\\'
      )
    )
    ORDER BY rank DESC, d.updated_at DESC
    LIMIT ${params.limit}
  `);

  return rows.map((r) => ({ id: r.id, rank: Number(r.rank) }));
}
