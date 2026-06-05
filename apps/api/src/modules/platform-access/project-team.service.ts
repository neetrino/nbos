import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type ProjectTeamRoleEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  assertCanAssignProjectTeamAdmin,
  assertCanManageProjectTeam,
} from './project-team-authorization';
import { teamMemberEmployeeSelect } from './team-member.select';

interface AddProjectTeamMemberDto {
  employeeId: string;
  role?: ProjectTeamRoleEnum;
}

interface UpdateProjectTeamMemberDto {
  role?: ProjectTeamRoleEnum;
}

@Injectable()
export class ProjectTeamService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  async listByProject(projectId: string) {
    await this.assertProjectExists(projectId);
    return this.prisma.projectTeamMember.findMany({
      where: { projectId },
      include: { employee: { select: teamMemberEmployeeSelect } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addMember(
    projectId: string,
    dto: AddProjectTeamMemberDto,
    actorId: string,
    actorRoleSlug: string,
  ) {
    await this.assertProjectExists(projectId);
    const actorProjectRole = await this.findActorProjectRole(projectId, actorId);
    assertCanManageProjectTeam(actorRoleSlug, actorProjectRole);
    const role = dto.role ?? 'MEMBER';
    if (role === 'ADMIN') {
      assertCanAssignProjectTeamAdmin(actorRoleSlug, actorProjectRole);
    }
    const member = await this.prisma.projectTeamMember.upsert({
      where: {
        projectId_employeeId: { projectId, employeeId: dto.employeeId },
      },
      create: {
        projectId,
        employeeId: dto.employeeId,
        role,
        source: 'MANUAL',
        addedById: actorId,
      },
      update: {
        ...(dto.role !== undefined && { role }),
        source: 'MANUAL',
        addedById: actorId,
      },
      include: { employee: { select: teamMemberEmployeeSelect } },
    });
    await this.audit.log({
      entityType: 'project',
      entityId: projectId,
      action: 'project.team.member_added',
      userId: actorId,
      projectId,
      changes: { employeeId: dto.employeeId, role: member.role },
    });
    return member;
  }

  async updateMember(
    projectId: string,
    employeeId: string,
    dto: UpdateProjectTeamMemberDto,
    actorId: string,
    actorRoleSlug: string,
  ) {
    const existing = await this.findMemberOrThrow(projectId, employeeId);
    const actorProjectRole = await this.findActorProjectRole(projectId, actorId);
    assertCanManageProjectTeam(actorRoleSlug, actorProjectRole);
    if (dto.role === 'ADMIN') {
      assertCanAssignProjectTeamAdmin(actorRoleSlug, actorProjectRole);
    }
    const member = await this.prisma.projectTeamMember.update({
      where: { id: existing.id },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        addedById: actorId,
      },
      include: { employee: { select: teamMemberEmployeeSelect } },
    });
    await this.audit.log({
      entityType: 'project',
      entityId: projectId,
      action: 'project.team.member_updated',
      userId: actorId,
      projectId,
      changes: { employeeId, role: member.role },
    });
    return member;
  }

  async removeMember(
    projectId: string,
    employeeId: string,
    actorId: string,
    actorRoleSlug: string,
  ) {
    const existing = await this.findMemberOrThrow(projectId, employeeId);
    const actorProjectRole = await this.findActorProjectRole(projectId, actorId);
    assertCanManageProjectTeam(actorRoleSlug, actorProjectRole);
    await this.prisma.projectTeamMember.delete({ where: { id: existing.id } });
    await this.audit.log({
      entityType: 'project',
      entityId: projectId,
      action: 'project.team.member_removed',
      userId: actorId,
      projectId,
      changes: { employeeId },
    });
    return { removed: true };
  }

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async findActorProjectRole(
    projectId: string,
    actorId: string,
  ): Promise<ProjectTeamRoleEnum | null> {
    const row = await this.prisma.projectTeamMember.findUnique({
      where: { projectId_employeeId: { projectId, employeeId: actorId } },
      select: { role: true },
    });
    return row?.role ?? null;
  }

  private async findMemberOrThrow(projectId: string, employeeId: string) {
    const member = await this.prisma.projectTeamMember.findUnique({
      where: { projectId_employeeId: { projectId, employeeId } },
    });
    if (!member) {
      throw new NotFoundException(`Project team member ${employeeId} not found`);
    }
    return member;
  }
}
