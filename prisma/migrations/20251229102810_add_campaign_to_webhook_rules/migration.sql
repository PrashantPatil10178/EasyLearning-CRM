-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webhook_assignment_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "campaignId" TEXT,
    "assignmentType" TEXT NOT NULL DEFAULT 'SPECIFIC',
    "percentage" INTEGER,
    "assigneeId" TEXT NOT NULL,
    "lastAssignedAt" DATETIME,
    "assignmentCount" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "webhook_assignment_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "webhook_assignment_rules_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "webhook_assignment_rules_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_webhook_assignment_rules" ("assigneeId", "assignmentCount", "assignmentType", "createdAt", "id", "isEnabled", "lastAssignedAt", "percentage", "priority", "source", "status", "updatedAt", "workspaceId") SELECT "assigneeId", "assignmentCount", "assignmentType", "createdAt", "id", "isEnabled", "lastAssignedAt", "percentage", "priority", "source", "status", "updatedAt", "workspaceId" FROM "webhook_assignment_rules";
DROP TABLE "webhook_assignment_rules";
ALTER TABLE "new_webhook_assignment_rules" RENAME TO "webhook_assignment_rules";
CREATE INDEX "webhook_assignment_rules_workspaceId_idx" ON "webhook_assignment_rules"("workspaceId");
CREATE INDEX "webhook_assignment_rules_assigneeId_idx" ON "webhook_assignment_rules"("assigneeId");
CREATE INDEX "webhook_assignment_rules_campaignId_idx" ON "webhook_assignment_rules"("campaignId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
