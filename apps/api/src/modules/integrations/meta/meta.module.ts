import { Module } from '@nestjs/common';
import { LeadsModule } from '../../crm/leads/leads.module';
import { MetaAccountsService } from './meta-accounts.service';
import { MetaController } from './meta.controller';
import { MetaLeadIngestService } from './meta-lead-ingest.service';
import { MetaOAuthService } from './meta-oauth.service';
import { MetaProviderConfig } from './meta-provider.config';
import { MetaProviderSecretStore } from './meta-provider-secret.store';
import { MetaWebhookService } from './meta-webhook.service';

@Module({
  imports: [LeadsModule],
  controllers: [MetaController],
  providers: [
    MetaProviderConfig,
    MetaProviderSecretStore,
    MetaOAuthService,
    MetaAccountsService,
    MetaWebhookService,
    MetaLeadIngestService,
  ],
})
export class MetaModule {}
