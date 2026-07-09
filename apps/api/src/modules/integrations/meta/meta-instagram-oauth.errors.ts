import { BadRequestException } from '@nestjs/common';

export type MetaInstagramOAuthStage = 'token_exchange' | 'long_lived_token' | 'profile';

/** Typed Instagram OAuth failure with a stable stage for callback error mapping. */
export class MetaInstagramOAuthException extends BadRequestException {
  readonly stage: MetaInstagramOAuthStage;

  constructor(message: string, stage: MetaInstagramOAuthStage) {
    super(message);
    this.stage = stage;
  }
}
