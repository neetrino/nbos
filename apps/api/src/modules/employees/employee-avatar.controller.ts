import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  RequirePermission,
  SkipTransform,
  type CurrentUserPayload,
} from '../../common/decorators';
import { EmployeeAvatarService } from './employee-avatar.service';
import {
  EMPLOYEE_AVATAR_FILE_INTERCEPTOR_OPTIONS,
  requireEmployeeAvatarUpload,
  requireEmployeeId,
  type EmployeeAvatarMemoryUpload,
} from './employee-avatar-http';
import { EMPLOYEE_AVATAR_CACHE_CONTROL } from './employee-avatar.constants';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeAvatarController {
  constructor(private readonly avatars: EmployeeAvatarService) {}

  @Get(':id/avatar')
  @SkipTransform()
  @Header('Cache-Control', EMPLOYEE_AVATAR_CACHE_CONTROL)
  @ApiOperation({ summary: 'Read the employee profile photo (authenticated team members)' })
  async getAvatar(@Param('id') id: string): Promise<StreamableFile> {
    const image = await this.avatars.readBytes(id);
    return new StreamableFile(image.buffer, {
      type: image.mimeType,
      length: image.buffer.byteLength,
      disposition: 'inline',
    });
  }

  @Post(':id/avatar')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', EMPLOYEE_AVATAR_FILE_INTERCEPTOR_OPTIONS))
  @ApiOperation({ summary: 'Upload a profile photo for an employee (HR)' })
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: EmployeeAvatarMemoryUpload | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.avatars.uploadForEmployee(
      requireEmployeeId(user.id),
      id,
      requireEmployeeAvatarUpload(file),
    );
  }

  @Delete(':id/avatar')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Remove a profile photo for an employee (HR)' })
  removeAvatar(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.avatars.removeForEmployee(requireEmployeeId(user.id), id);
  }
}
