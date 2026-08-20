import { Module } from '@nestjs/common';
import { AtsCallContextResolver } from './ats-call-context.resolver';
import { AtsCallRedirectService } from './ats-call-redirect.service';
import { AtsCallService } from './ats-call.service';
import { AtsController } from './ats.controller';
import { AtsProviderConfig } from './ats-provider.config';
import { AtsWebhookService } from './ats-webhook.service';

@Module({
  controllers: [AtsController],
  providers: [
    AtsProviderConfig,
    AtsWebhookService,
    AtsCallService,
    AtsCallContextResolver,
    AtsCallRedirectService,
  ],
})
export class AtsModule {}
