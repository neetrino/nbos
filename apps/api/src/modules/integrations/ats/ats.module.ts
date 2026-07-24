import { Module } from '@nestjs/common';
import { AtsCallRedirectService } from './ats-call-redirect.service';
import { AtsController } from './ats.controller';
import { AtsLeadIngestService } from './ats-lead-ingest.service';
import { AtsProviderConfig } from './ats-provider.config';
import { AtsWebhookService } from './ats-webhook.service';

@Module({
  controllers: [AtsController],
  providers: [AtsProviderConfig, AtsWebhookService, AtsLeadIngestService, AtsCallRedirectService],
})
export class AtsModule {}
