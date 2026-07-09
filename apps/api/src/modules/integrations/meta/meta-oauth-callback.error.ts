import type { MetaOAuthErrorReason } from './meta.types';

export type MetaOAuthFailureStage =
  | 'state_validation'
  | 'instagram_token_exchange'
  | 'instagram_long_lived_token'
  | 'instagram_profile'
  | 'instagram_response_parsing'
  | 'instagram_account_persistence'
  | 'facebook_token_exchange'
  | 'facebook_pages'
  | 'callback_processing';

export interface InstagramPayloadShapeDiagnostic {
  topLevelKeys: string[];
  hasData: boolean;
  dataIsArray: boolean;
  dataLength: number;
}

export interface MetaOAuthCallbackErrorOptions {
  message: string;
  publicReason: MetaOAuthErrorReason;
  stage: MetaOAuthFailureStage;
  platform?: 'INSTAGRAM' | 'FACEBOOK';
  upstreamStatus?: number;
  upstreamCode?: string | number;
  upstreamType?: string;
  safeDetails?: string;
  cause?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Describes Instagram JSON envelope shape without logging token values. */
export function describeInstagramPayloadShape(payload: unknown): InstagramPayloadShapeDiagnostic {
  if (!isRecord(payload)) {
    return {
      topLevelKeys: [],
      hasData: false,
      dataIsArray: false,
      dataLength: 0,
    };
  }

  const data = payload.data;
  return {
    topLevelKeys: Object.keys(payload),
    hasData: 'data' in payload,
    dataIsArray: Array.isArray(data),
    dataLength: Array.isArray(data) ? data.length : 0,
  };
}

export function formatInstagramPayloadDiagnostic(payload: unknown): string {
  return JSON.stringify(describeInstagramPayloadShape(payload));
}

/** Typed Meta OAuth callback failure safe for frontend reason mapping and backend logs. */
export class MetaOAuthCallbackError extends Error {
  readonly publicReason: MetaOAuthErrorReason;
  readonly stage: MetaOAuthFailureStage;
  readonly platform?: 'INSTAGRAM' | 'FACEBOOK';
  readonly upstreamStatus?: number;
  readonly upstreamCode?: string | number;
  readonly upstreamType?: string;
  readonly safeDetails?: string;

  constructor(options: MetaOAuthCallbackErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'MetaOAuthCallbackError';
    this.publicReason = options.publicReason;
    this.stage = options.stage;
    this.platform = options.platform;
    this.upstreamStatus = options.upstreamStatus;
    this.upstreamCode = options.upstreamCode;
    this.upstreamType = options.upstreamType;
    this.safeDetails = options.safeDetails;
  }

  static fromPrismaPersistence(cause: unknown): MetaOAuthCallbackError {
    const prismaCode = isRecord(cause) && typeof cause.code === 'string' ? cause.code : undefined;
    const safeDetails = prismaCode ? `prisma_code=${prismaCode}` : undefined;
    return new MetaOAuthCallbackError({
      message: 'Instagram connected account could not be saved',
      publicReason: 'instagram_account_save_failed',
      stage: 'instagram_account_persistence',
      platform: 'INSTAGRAM',
      safeDetails,
      cause,
    });
  }
}
