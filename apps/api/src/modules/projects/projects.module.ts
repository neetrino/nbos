import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProductsModule } from './products/products.module';
import { ProductsController } from './products/products.controller';
import { ExtensionsModule } from './extensions/extensions.module';
import { ExtensionsController } from './extensions/extensions.controller';
import { PlatformAccessModule } from '../platform-access/platform-access.module';

@Module({
  imports: [AuditModule, ProductsModule, ExtensionsModule, PlatformAccessModule],
  // Order matters: static `projects/products` and `projects/extensions` before `projects/:id`.
  controllers: [ProductsController, ExtensionsController, ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
