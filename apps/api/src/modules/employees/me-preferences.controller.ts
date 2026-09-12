import { Body, Controller, Get, NotFoundException, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { UpdateInterfaceLocaleDto } from './dto/update-interface-locale.dto';
import { EmployeeInterfaceLocaleService } from './employee-interface-locale.service';

@ApiTags('Me')
@ApiBearerAuth()
@Controller('v1/me')
export class MePreferencesController {
  constructor(private readonly interfaceLocaleService: EmployeeInterfaceLocaleService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get the current employee interface locale preference' })
  getPreferences(@CurrentUser() user: CurrentUserPayload) {
    return this.interfaceLocaleService.getPreferences(requireEmployeeId(user));
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update the current employee interface locale preference' })
  @ApiBody({ type: UpdateInterfaceLocaleDto })
  updatePreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: UpdateInterfaceLocaleDto,
  ) {
    return this.interfaceLocaleService.updatePreferences(
      requireEmployeeId(user),
      body.interfaceLocale,
    );
  }
}

function requireEmployeeId(user: CurrentUserPayload): string {
  if (!user?.id) {
    throw new NotFoundException('Employee record not found for this user');
  }
  return user.id;
}
