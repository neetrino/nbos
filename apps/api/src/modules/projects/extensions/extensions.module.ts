import { Module } from '@nestjs/common';
import { NotificationModule } from '../../notifications/notification.module';
import { ExtensionsService } from './extensions.service';

/**
 * Controllers are registered on {@link ProjectsModule} before {@link ProjectsController}
 * so that `GET /api/projects/extensions` is not captured by `GET /api/projects/:id`.
 */
@Module({
  imports: [NotificationModule],
  providers: [ExtensionsService],
  exports: [ExtensionsService],
})
export class ExtensionsModule {}
