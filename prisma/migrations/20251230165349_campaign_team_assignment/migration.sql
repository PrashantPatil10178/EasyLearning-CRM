-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "campaigns_teamId_idx" ON "campaigns"("teamId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
