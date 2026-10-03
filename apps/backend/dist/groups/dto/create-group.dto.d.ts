import { GroupType } from '@prisma/client';
export declare class CreateGroupDto {
    name: string;
    description?: string;
    type: GroupType;
}
