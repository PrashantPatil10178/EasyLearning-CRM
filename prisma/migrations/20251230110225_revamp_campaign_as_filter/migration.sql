-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "customEndDate" TIMESTAMP(3),
ADD COLUMN     "customStartDate" TIMESTAMP(3),
ADD COLUMN     "sourceFilter" TEXT,
ADD COLUMN     "timelineFilter" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
