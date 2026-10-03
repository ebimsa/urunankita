import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        accessToken: string;
        user: {
            fullName: string;
            email: string | null;
            phone: string | null;
            id: string;
            avatarUrl: string | null;
            role: import("@prisma/client").$Enums.GlobalRole;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatarUrl: string | null;
            role: import("@prisma/client").$Enums.GlobalRole;
            createdAt: Date;
        };
    }>;
    getProfile(userId: string): Promise<{
        fullName: string;
        email: string | null;
        phone: string | null;
        id: string;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.GlobalRole;
        createdAt: Date;
        memberships: {
            group: {
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.GroupType;
                joinCode: string;
            };
            role: import("@prisma/client").$Enums.MemberRole;
            groupId: string;
        }[];
    }>;
}
