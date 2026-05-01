import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProductsModule } from './products/products.module';
import { ProductsController } from './products/products.controller';
import { ExtensionsModule } from './extensions/extensions.module';
import { ExtensionsController } from './extensions/extensions.controller';
import { ProjectKickoffChecklistService } from './project-kickoff-checklist.service';

@Module({
  imports: [ProductsModule, ExtensionsModule],
  // Order matters: static `projects/products` and `projects/extensions` before `projects/:id`.
  controllers: [ProductsController, ExtensionsController, ProjectsController],
  providers: [ProjectsService, ProjectKickoffChecklistService],
  exports: [ProjectsService, ProjectKickoffChecklistService],
})
export class ProjectsModule {}
