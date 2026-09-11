import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { MessengerCoreInternalService } from './messenger-core-internal.service';

@ApiTags('Messenger Core Internal')
@ApiBearerAuth()
@Controller('messenger/core/internal/entities')
export class MessengerCoreInternalEntityController {
  constructor(private readonly internal: MessengerCoreInternalService) {}

  @Post('products/:productId')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({
    summary: 'Ensure the Internal Product conversation shared with its Connected Work Space',
  })
  ensureProduct(@Param('productId') productId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.internal.ensureProduct(productId, user.id);
  }

  @Post('work-spaces/:workspaceId')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({
    summary: 'Ensure Internal Work Space conversation; Connected spaces reuse the Product id',
  })
  ensureWorkSpace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.internal.ensureWorkSpace(workspaceId, user.id, user.permissions.TASKS_VIEW);
  }

  @Post('deals/:dealId')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Ensure Internal Deal discussion (never Client Sales / EXTERNAL)' })
  ensureDeal(@Param('dealId') dealId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.internal.ensureDeal(dealId, user.id);
  }

  @Post('projects/:projectId/general')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({
    summary: 'Lazily ensure optional Project General; not called from Project create or list',
  })
  ensureProjectGeneral(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.internal.ensureProjectGeneral(projectId, user.id);
  }
}
