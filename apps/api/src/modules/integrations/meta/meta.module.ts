import { Module } from '@nestjs/common';
import { MetaAccountsService } from './meta-accounts.service';
import { MetaController } from './meta.controller';
import { MetaLeadIngestService } from './meta-lead-ingest.service';
import { MetaOAuthService } from './meta-oauth.service';
import { MetaProfileService } from './meta-profile.service';
import { MetaProviderConfig } from './meta-provider.config';
import { MetaProviderSecretStore } from './meta-provider-secret.store';
import { MetaWebhookService } from './meta-webhook.service';

@Module({
  controllers: [MetaController],
  providers: [
    MetaProviderConfig,
    MetaProviderSecretStore,
    MetaOAuthService,
    MetaAccountsService,
    MetaWebhookService,
    MetaProfileService,
    MetaLeadIngestService,
  ],
})
export class MetaModule {}
