import { Module } from '@nestjs/common';
import { NotificationModule } from '../../notifications/notification.module';
import { ProductsService } from './products.service';

/**
 * Controllers are registered on {@link ProjectsModule} before {@link ProjectsController}
 * so that `GET /api/projects/products` is not captured by `GET /api/projects/:id`.
 */
@Module({
  imports: [NotificationModule],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
