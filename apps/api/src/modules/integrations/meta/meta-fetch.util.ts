export const META_PROFILE_FETCH_TIMEOUT_MS = 2500;

export type MetaGraphTarget = 'FACEBOOK' | 'INSTAGRAM';

export type MetaGraphRequest = {
  target: MetaGraphTarget;
  graphVersion: string;
  resourceId: string;
  fields: readonly string[];
  accessToken: string;
  timeoutMs?: number;
};

export type MetaFetchJsonResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export const META_GRAPH_FACEBOOK_ORIGIN = 'https://graph.facebook.com';
export const META_GRAPH_INSTAGRAM_ORIGIN = 'https://graph.instagram.com';

const META_GRAPH_ALLOWED_ORIGINS = new Set<string>([
  META_GRAPH_FACEBOOK_ORIGIN,
  META_GRAPH_INSTAGRAM_ORIGIN,
]);

const META_GRAPH_TARGET_ORIGIN: Record<MetaGraphTarget, string> = {
  FACEBOOK: META_GRAPH_FACEBOOK_ORIGIN,
  INSTAGRAM: META_GRAPH_INSTAGRAM_ORIGIN,
};

export const META_GRAPH_RESOURCE_ID_PATTERN = /^\d+$/;
export const META_GRAPH_VERSION_PATTERN = /^v\d+\.\d+$/;

export const FACEBOOK_MESSAGING_PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'name',
  'profile_pic',
] as const;

export const INSTAGRAM_MESSAGING_PROFILE_FIELDS = ['name', 'username', 'profile_pic'] as const;

const ALLOWED_FIELDS_BY_TARGET: Record<MetaGraphTarget, ReadonlySet<string>> = {
  FACEBOOK: new Set(FACEBOOK_MESSAGING_PROFILE_FIELDS),
  INSTAGRAM: new Set(INSTAGRAM_MESSAGING_PROFILE_FIELDS),
};

export class MetaGraphValidationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'MetaGraphValidationError';
  }
}

/** Validates Meta scoped sender IDs used as Graph resource path segments. */
export function validateMetaGraphResourceId(resourceId: string): void {
  if (!META_GRAPH_RESOURCE_ID_PATTERN.test(resourceId)) {
    throw new MetaGraphValidationError('invalid_resource_id');
  }
}

/** Validates configured Graph API version strings. */
export function validateMetaGraphVersion(graphVersion: string): void {
  if (!META_GRAPH_VERSION_PATTERN.test(graphVersion)) {
    throw new MetaGraphValidationError('invalid_graph_version');
  }
}

function validateMetaGraphFields(target: MetaGraphTarget, fields: readonly string[]): void {
  if (fields.length === 0) {
    throw new MetaGraphValidationError('invalid_fields');
  }
  const allowed = ALLOWED_FIELDS_BY_TARGET[target];
  for (const field of fields) {
    if (!allowed.has(field)) {
      throw new MetaGraphValidationError('invalid_fields');
    }
  }
}

function assertAllowedMetaGraphUrl(url: URL, target: MetaGraphTarget): void {
  if (!META_GRAPH_ALLOWED_ORIGINS.has(url.origin)) {
    throw new MetaGraphValidationError('invalid_origin');
  }
  if (url.origin !== META_GRAPH_TARGET_ORIGIN[target]) {
    throw new MetaGraphValidationError('invalid_origin');
  }
  if (url.protocol !== 'https:') {
    throw new MetaGraphValidationError('invalid_protocol');
  }
  if (url.username !== '' || url.password !== '') {
    throw new MetaGraphValidationError('invalid_credentials');
  }
  if (url.port !== '' && url.port !== '443') {
    throw new MetaGraphValidationError('invalid_port');
  }
}

/** Builds a constrained Meta Graph URL from validated request parts. */
export function buildMetaGraphUrl(request: MetaGraphRequest): URL {
  validateMetaGraphResourceId(request.resourceId);
  validateMetaGraphVersion(request.graphVersion);
  validateMetaGraphFields(request.target, request.fields);

  const origin = META_GRAPH_TARGET_ORIGIN[request.target];
  const url = new URL(`/${request.graphVersion}/${request.resourceId}`, origin);
  assertAllowedMetaGraphUrl(url, request.target);
  url.searchParams.set('fields', request.fields.join(','));
  url.searchParams.set('access_token', request.accessToken);
  assertAllowedMetaGraphUrl(url, request.target);
  return url;
}

/** Extracts and validates Graph API version from an internal configured base URL. */
export function extractGraphVersionFromBaseUrl(
  graphBaseUrl: string,
  target: MetaGraphTarget,
): string {
  let parsed: URL;
  try {
    parsed = new URL(graphBaseUrl);
  } catch {
    throw new MetaGraphValidationError('invalid_graph_base_url');
  }
  assertAllowedMetaGraphUrl(parsed, target);
  const version = parsed.pathname.replace(/^\/+|\/+$/g, '');
  validateMetaGraphVersion(version);
  return version;
}

/**
 * Fetches JSON from an allowlisted Meta Graph origin only.
 * Rejects arbitrary URLs, redirects, and invalid resource identifiers.
 */
export async function fetchMetaGraphJson(request: MetaGraphRequest): Promise<MetaFetchJsonResult> {
  const url = buildMetaGraphUrl(request);
  const timeoutMs = request.timeoutMs ?? META_PROFILE_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'error',
      signal: controller.signal,
    });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, status: 0, body: { error: { message: 'Profile lookup timed out' } } };
    }
    const message = error instanceof Error ? error.message : 'Profile lookup failed';
    return { ok: false, status: 0, body: { error: { message } } };
  } finally {
    clearTimeout(timer);
  }
}
