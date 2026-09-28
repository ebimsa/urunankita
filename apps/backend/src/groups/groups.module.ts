import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service.js';
import { GroupsController } from './groups.controller.js';
import { GroupRolesGuard } from './guards/group-roles.guard.js';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, GroupRolesGuard],
  exports: [GroupsService, GroupRolesGuard],
})
export class GroupsModule {}
