/*
  Warnings:

  - The `source` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "leads" DROP COLUMN "source",
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'WEBSITE';

-- AlterTable
ALTER TABLE "webhook_assignment_rules" ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "assigneeId" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."LeadSource";

-- CreateIndex
CREATE INDEX "webhook_assignment_rules_teamId_idx" ON "webhook_assignment_rules"("teamId");

-- AddForeignKey
ALTER TABLE "webhook_assignment_rules" ADD CONSTRAINT "webhook_assignment_rules_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
