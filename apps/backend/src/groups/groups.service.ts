import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupType, MemberRole, MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { JoinGroupDto } from './dto/join-group.dto.js';
import { CreateUnitDto } from './dto/create-unit.dto.js';
import { CreateUnitsBulkDto } from './dto/create-units-bulk.dto.js';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper untuk generate kode gabung acak (contoh: EY-8392 atau KAS-294)
  private generateJoinCode(prefix = 'EY'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`;
  }

  async create(userId: string, dto: CreateGroupDto) {
    let joinCode = this.generateJoinCode(dto.type === GroupType.PHYSICAL_UNIT ? 'RT' : 'KOM');
    let isCodeUnique = false;
    while (!isCodeUnique) {
      const existing = await this.prisma.group.findUnique({
        where: { joinCode },
      });
      if (!existing) {
        isCodeUnique = true;
      } else {
        joinCode = this.generateJoinCode('EY');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.name,
          description: dto.description,
          type: dto.type,
          joinCode,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: MemberRole.OWNER,
          status: MembershipStatus.APPROVED,
          isActive: true,
        },
      });

      await tx.groupPaymentConfig.create({
        data: {
          groupId: group.id,
          cashEnabled: true,
        },
      });

      return {
        message: 'Grup berhasil dibuat',
        group,
      };
    });
  }

  async getMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: { where: { status: MembershipStatus.APPROVED } },
                units: true,
              },
            },
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((m) => ({
      id: m.id,
      membershipId: m.id,
      groupId: m.groupId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      unit: m.unit,
      group: {
        id: m.group.id,
        name: m.group.name,
        description: m.group.description,
        type: m.group.type,
        joinCode: m.group.joinCode,
        totalMembers: m.group._count.members,
        totalUnits: m.group._count.units,
        createdAt: m.group.createdAt,
      },
    }));
  }

  async getGroupById(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            members: { where: { status: MembershipStatus.APPROVED } },
            units: true,
            bills: true,
          },
        },
        paymentConfig: {
          select: {
            qrisEnabled: true,
            merchantName: true,
            bankEnabled: true,
            bankName: true,
            accountNumber: true,
            accountHolder: true,
            cashEnabled: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grup tidak ditemukan');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        unit: true,
      },
    });

    return {
      group,
      myMembership: membership
        ? {
            role: membership.role,
            status: membership.status,
            unit: membership.unit,
          }
        : null,
    };
  }

  async previewGroupByJoinCode(joinCode: string) {
    const group = await this.prisma.group.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        joinCode: true,
        units: {
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Kode grup tidak ditemukan atau tidak valid');
    }

    return group;
  }

  async joinGroup(userId: string, dto: JoinGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { joinCode: dto.joinCode.trim().toUpperCase() },
    });

    if (!group) {
      throw new NotFoundException('Kode grup (join code) tidak valid atau tidak ditemukan');
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === MembershipStatus.PENDING) {
        throw new ConflictException(
          'Pengajuan bergabung Anda masih menunggu persetujuan pengurus grup',
        );
      }
      if (existingMember.status === MembershipStatus.APPROVED) {
        throw new ConflictException('Anda sudah terdaftar sebagai anggota aktif dalam grup ini');
      }
    }

    if (group.type === GroupType.PHYSICAL_UNIT) {
      if (!dto.unitId && !dto.unitName?.trim()) {
        throw new BadRequestException(
          'Untuk grup berbasis unit fisik (RT/Kost), Anda wajib memilih atau memasukkan nomor unit/rumah yang Anda tempati',
        );
      }

      let unit: any = null;

      if (dto.unitId) {
        unit = await this.prisma.groupUnit.findFirst({
          where: {
            id: dto.unitId,
            groupId: group.id,
          },
        });

        if (!unit) {
          throw new NotFoundException('Unit hunian/kamar yang dipilih tidak terdaftar dalam grup ini');
        }
      } else if (dto.unitName?.trim()) {
        const cleanName = dto.unitName.trim();
        unit = await this.prisma.groupUnit.findFirst({
          where: {
            groupId: group.id,
            name: {
              equals: cleanName,
              mode: 'insensitive',
            },
          },
        });

        if (!unit) {
          unit = await this.prisma.groupUnit.create({
            data: {
              groupId: group.id,
              name: cleanName,
            },
          });
        }
      }

      const membership = await this.prisma.groupMember.upsert({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId,
          },
        },
        create: {
          groupId: group.id,
          userId,
          unitId: unit.id,
          role: MemberRole.MEMBER,
          status: MembershipStatus.PENDING,
          isActive: true,
        },
        update: {
          unitId: unit.id,
          status: MembershipStatus.PENDING,
          isActive: true,
        },
      });

      return {
        message: 'Pengajuan bergabung ke unit berhasil dikirim. Menunggu persetujuan pengurus grup.',
        status: membership.status,
        groupId: group.id,
        unitName: unit.name,
      };
    } else {
      const membership = await this.prisma.groupMember.upsert({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId,
          },
        },
        create: {
          groupId: group.id,
          userId,
          role: MemberRole.MEMBER,
          status: MembershipStatus.APPROVED,
          isActive: true,
        },
        update: {
          status: MembershipStatus.APPROVED,
          isActive: true,
        },
      });

      return {
        message: 'Berhasil bergabung dengan grup.',
        status: membership.status,
        groupId: group.id,
      };
    }
  }

  // --- MANAJEMEN UNIT HUNIAN ---
  async createUnit(groupId: string, dto: CreateUnitDto) {
    const existing = await this.prisma.groupUnit.findUnique({
      where: {
        groupId_name: {
          groupId,
          name: dto.name.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Unit dengan nama "${dto.name}" sudah terdaftar di grup ini`);
    }

    return this.prisma.groupUnit.create({
      data: {
        groupId,
        name: dto.name.trim(),
        description: dto.description,
      },
    });
  }

  async createUnitsBulk(groupId: string, dto: CreateUnitsBulkDto) {
    const cleanNames = [...new Set(dto.names.map((n) => n.trim()))].filter((n) => n.length > 0);

    const existingUnits = await this.prisma.groupUnit.findMany({
      where: {
        groupId,
        name: { in: cleanNames },
      },
      select: { name: true },
    });

    const existingNamesSet = new Set(existingUnits.map((u) => u.name));
    const newNames = cleanNames.filter((name) => !existingNamesSet.has(name));

    if (newNames.length === 0) {
      throw new ConflictException('Seluruh nama unit dalam daftar sudah terdaftar sebelumnya');
    }

    await this.prisma.groupUnit.createMany({
      data: newNames.map((name) => ({
        groupId,
        name,
      })),
    });

    return {
      message: `${newNames.length} unit berhasil ditambahkan ke grup`,
      addedCount: newNames.length,
      skippedCount: cleanNames.length - newNames.length,
    };
  }

  async getUnits(groupId: string) {
    return this.prisma.groupUnit.findMany({
      where: { groupId },
      include: {
        occupants: {
          where: { status: MembershipStatus.APPROVED, isActive: true },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // --- MANAJEMEN ANGGOTA & PERSETUJUAN ---
  async getMembers(groupId: string) {
    return this.prisma.groupMember.findMany({
      where: { groupId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' },
      ],
    });
  }

  async getPendingMembers(groupId: string) {
    return this.prisma.groupMember.findMany({
      where: {
        groupId,
        status: MembershipStatus.PENDING,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }

  async approveMember(groupId: string, memberId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
      include: { unit: true },
    });

    if (!member) {
      throw new NotFoundException('Data pengajuan anggota tidak ditemukan');
    }

    await this.prisma.groupMember.update({
      where: { id: memberId },
      data: {
        status: MembershipStatus.APPROVED,
        isActive: true,
      },
    });

    return {
      message: `Persetujuan berhasil. Anggota kini aktif terhubung${member.unit ? ` dengan ${member.unit.name}` : ''}.`,
    };
  }

  async rejectMember(groupId: string, memberId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
    });

    if (!member) {
      throw new NotFoundException('Data pengajuan anggota tidak ditemukan');
    }

    await this.prisma.groupMember.update({
      where: { id: memberId },
      data: {
        status: MembershipStatus.REJECTED,
      },
    });

    return {
      message: 'Pengajuan anggota berhasil ditolak.',
    };
  }

  async updateMemberRole(groupId: string, memberId: string, newRole: MemberRole) {
    if (newRole === MemberRole.OWNER) {
      throw new BadRequestException('Peran OWNER tidak dapat diubah melalui endpoint ini');
    }

    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
    });

    if (!member) {
      throw new NotFoundException('Anggota tidak ditemukan');
    }

    if (member.role === MemberRole.OWNER) {
      throw new BadRequestException('Peran pembuat grup (OWNER) tidak dapat diubah');
    }

    await this.prisma.groupMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    return {
      message: `Peran anggota berhasil diubah menjadi ${newRole}`,
    };
  }

  async removeMember(groupId: string, memberId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
    });

    if (!member) {
      throw new NotFoundException('Anggota tidak ditemukan');
    }

    if (member.role === MemberRole.OWNER) {
      throw new BadRequestException('Pembuat grup (OWNER) tidak dapat dikeluarkan dari grup');
    }

    await this.prisma.groupMember.delete({
      where: { id: memberId },
    });

    return {
      message: 'Anggota berhasil dikeluarkan dari grup',
    };
  }
}
