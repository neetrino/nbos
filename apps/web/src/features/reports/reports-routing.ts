export type ReportsSectionId = 'finance' | 'growth' | 'delivery' | 'center';

/** Runtime view ids aligned with API report categories + center ops. */
export type ReportsViewId =
  | 'FINANCE'
  | 'SALES'
  | 'MARKETING'
  | 'PROJECTS'
  | 'SPECIALISTS'
  | 'SCHEDULED'
  | 'EXPORTS'
  | 'QUALITY';

export type ParsedReportsPath = {
  sectionId: ReportsSectionId;
  viewId: ReportsViewId;
};

const REPORTS_BASE = '/reports';

const VIEW_SLUG_BY_ID: Record<ReportsViewId, string> = {
  FINANCE: 'overview',
  SALES: 'sales',
  MARKETING: 'marketing',
  PROJECTS: 'projects',
  SPECIALISTS: 'specialists',
  SCHEDULED: 'scheduled',
  EXPORTS: 'exports',
  QUALITY: 'quality',
};

const VIEW_ID_BY_SLUG: Record<string, ReportsViewId> = Object.fromEntries(
  Object.entries(VIEW_SLUG_BY_ID).map(([viewId, slug]) => [slug, viewId as ReportsViewId]),
) as Record<string, ReportsViewId>;

const VIEW_SECTION: Record<ReportsViewId, ReportsSectionId> = {
  FINANCE: 'finance',
  SALES: 'growth',
  MARKETING: 'growth',
  PROJECTS: 'delivery',
  SPECIALISTS: 'delivery',
  SCHEDULED: 'center',
  EXPORTS: 'center',
  QUALITY: 'center',
};

/** Build canonical path for a reports view. */
export function buildReportsViewPath(viewId: ReportsViewId): string {
  const sectionId = VIEW_SECTION[viewId];
  const slug = VIEW_SLUG_BY_ID[viewId];
  if (sectionId === 'finance') {
    return `${REPORTS_BASE}/finance`;
  }
  return `${REPORTS_BASE}/${sectionId}/${slug}`;
}

/** Parse `/reports` paths; returns null when not a reports route or unknown segments. */
export function parseReportsPathname(pathname: string): ParsedReportsPath | null {
  const normalized = pathname.split('?')[0] ?? pathname;
  if (normalized === REPORTS_BASE) {
    return null;
  }
  if (!normalized.startsWith(`${REPORTS_BASE}/`)) {
    return null;
  }

  const rest = normalized.slice(`${REPORTS_BASE}/`.length);
  const segments = rest.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const [zone, maybeView] = segments;
  if (zone === 'finance') {
    if (segments.length > 2) return null;
    if (maybeView && maybeView !== VIEW_SLUG_BY_ID.FINANCE) return null;
    return { sectionId: 'finance', viewId: 'FINANCE' };
  }

  if (zone === 'growth') {
    const viewId = maybeView ? VIEW_ID_BY_SLUG[maybeView] : undefined;
    if (!viewId || VIEW_SECTION[viewId] !== 'growth') return null;
    return { sectionId: 'growth', viewId };
  }

  if (zone === 'delivery') {
    const viewId = maybeView ? VIEW_ID_BY_SLUG[maybeView] : undefined;
    if (!viewId || VIEW_SECTION[viewId] !== 'delivery') return null;
    return { sectionId: 'delivery', viewId };
  }

  if (zone === 'center') {
    const viewId = maybeView ? VIEW_ID_BY_SLUG[maybeView] : undefined;
    if (!viewId || VIEW_SECTION[viewId] !== 'center') return null;
    return { sectionId: 'center', viewId };
  }

  return null;
}

export function isReportsModulePath(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return normalized === REPORTS_BASE || normalized.startsWith(`${REPORTS_BASE}/`);
}

export function reportsViewSlug(viewId: ReportsViewId): string {
  return VIEW_SLUG_BY_ID[viewId];
}
