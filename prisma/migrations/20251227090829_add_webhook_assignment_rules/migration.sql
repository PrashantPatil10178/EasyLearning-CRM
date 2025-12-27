-- CreateTable
CREATE TABLE "webhook_assignment_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assigneeId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "webhook_assignment_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "webhook_assignment_rules_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "webhook_assignment_rules_workspaceId_idx" ON "webhook_assignment_rules"("workspaceId");

-- CreateIndex
CREATE INDEX "webhook_assignment_rules_assigneeId_idx" ON "webhook_assignment_rules"("assigneeId");
