-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'CREDIT';

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "description" TEXT,
ALTER COLUMN "bank" DROP NOT NULL;
