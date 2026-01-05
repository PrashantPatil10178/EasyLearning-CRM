-- CreateTable
CREATE TABLE "lead_status_configs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "color" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_status_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_lead_reasons" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_lead_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_status_configs_workspaceId_idx" ON "lead_status_configs"("workspaceId");

-- CreateIndex
CREATE INDEX "lead_status_configs_stage_idx" ON "lead_status_configs"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_configs_workspaceId_name_key" ON "lead_status_configs"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "lost_lead_reasons_workspaceId_idx" ON "lost_lead_reasons"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "lost_lead_reasons_workspaceId_name_key" ON "lost_lead_reasons"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "lead_status_configs" ADD CONSTRAINT "lead_status_configs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_lead_reasons" ADD CONSTRAINT "lost_lead_reasons_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
