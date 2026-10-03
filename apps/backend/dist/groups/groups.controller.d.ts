import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { JoinGroupDto } from './dto/join-group.dto.js';
import { CreateUnitDto } from './dto/create-unit.dto.js';
import { CreateUnitsBulkDto } from './dto/create-units-bulk.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    createGroup(userId: string, dto: CreateGroupDto): Promise<{
        message: string;
        group: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            type: import("@prisma/client").$Enums.GroupType;
            joinCode: string;
        };
    }>;
    getMyGroups(userId: string): Promise<{
        id: string;
        membershipId: string;
        groupId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        status: import("@prisma/client").$Enums.MembershipStatus;
        joinedAt: Date;
        unit: {
            id: string;
            name: string;
        } | null;
        group: {
            id: string;
            name: string;
            description: string | null;
            type: import("@prisma/client").$Enums.GroupType;
            joinCode: string;
            totalMembers: number;
            totalUnits: number;
            createdAt: Date;
        };
    }[]>;
    joinGroup(userId: string, dto: JoinGroupDto): Promise<{
        message: string;
        status: import("@prisma/client").$Enums.MembershipStatus;
        groupId: string;
        unitName: any;
    } | {
        message: string;
        status: import("@prisma/client").$Enums.MembershipStatus;
        groupId: string;
        unitName?: undefined;
    }>;
    previewGroupByJoinCode(joinCode: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        type: import("@prisma/client").$Enums.GroupType;
        joinCode: string;
        units: {
            id: string;
            name: string;
            description: string | null;
        }[];
    }>;
    getGroupById(groupId: string, userId: string): Promise<{
        group: {
            _count: {
                bills: number;
                members: number;
                units: number;
            };
            paymentConfig: {
                qrisEnabled: boolean;
                merchantName: string | null;
                bankEnabled: boolean;
                bankName: string | null;
                accountNumber: string | null;
                accountHolder: string | null;
                cashEnabled: boolean;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            type: import("@prisma/client").$Enums.GroupType;
            joinCode: string;
        };
        myMembership: {
            role: import("@prisma/client").$Enums.MemberRole;
            status: import("@prisma/client").$Enums.MembershipStatus;
            unit: {
                id: string;
                createdAt: Date;
                name: string;
                groupId: string;
                description: string | null;
            } | null;
        } | null;
    }>;
    createUnit(groupId: string, dto: CreateUnitDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        groupId: string;
        description: string | null;
    }>;
    createUnitsBulk(groupId: string, dto: CreateUnitsBulkDto): Promise<{
        message: string;
        addedCount: number;
        skippedCount: number;
    }>;
    getUnits(groupId: string): Promise<({
        occupants: {
            user: {
                fullName: string;
                email: string | null;
                phone: string | null;
                id: string;
            };
            id: string;
            role: import("@prisma/client").$Enums.MemberRole;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        groupId: string;
        description: string | null;
    })[]>;
    deleteUnit(groupId: string, unitId: string): Promise<{
        message: string;
    }>;
    getMembers(groupId: string): Promise<({
        user: {
            fullName: string;
            email: string | null;
            phone: string | null;
            id: string;
            avatarUrl: string | null;
        };
        unit: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        role: import("@prisma/client").$Enums.MemberRole;
        groupId: string;
        userId: string;
        status: import("@prisma/client").$Enums.MembershipStatus;
        isActive: boolean;
        joinedAt: Date;
        unitId: string | null;
    })[]>;
    getPendingMembers(groupId: string): Promise<({
        user: {
            fullName: string;
            email: string | null;
            phone: string | null;
            id: string;
        };
        unit: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        role: import("@prisma/client").$Enums.MemberRole;
        groupId: string;
        userId: string;
        status: import("@prisma/client").$Enums.MembershipStatus;
        isActive: boolean;
        joinedAt: Date;
        unitId: string | null;
    })[]>;
    approveMember(groupId: string, memberId: string): Promise<{
        message: string;
    }>;
    rejectMember(groupId: string, memberId: string): Promise<{
        message: string;
    }>;
    updateMemberRole(groupId: string, memberId: string, dto: UpdateMemberRoleDto): Promise<{
        message: string;
    }>;
    removeMember(groupId: string, memberId: string): Promise<{
        message: string;
    }>;
    leaveGroup(groupId: string, userId: string): Promise<{
        message: string;
    }>;
    getAuditLogs(groupId: string, limit?: string): Promise<({
        user: {
            fullName: string;
            phone: string | null;
            id: string;
            role: import("@prisma/client").$Enums.GlobalRole;
        };
    } & {
        id: string;
        groupId: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        timestamp: Date;
    })[]>;
}
