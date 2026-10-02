-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN "status" "MembershipStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "GroupPaymentConfig" ADD COLUMN "accountDetails" TEXT,
ADD COLUMN "qrisImageUrl" TEXT;
