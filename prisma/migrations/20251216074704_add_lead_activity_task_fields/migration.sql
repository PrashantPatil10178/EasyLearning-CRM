-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    "message" TEXT,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "performedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_activities" ("createdAt", "description", "id", "leadId", "performedAt", "subject", "type", "userId") SELECT "createdAt", "description", "id", "leadId", "performedAt", "subject", "type", "userId" FROM "activities";
DROP TABLE "activities";
ALTER TABLE "new_activities" RENAME TO "activities";
CREATE INDEX "activities_leadId_idx" ON "activities"("leadId");
CREATE INDEX "activities_userId_idx" ON "activities"("userId");
CREATE TABLE "new_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "courseInterested" TEXT,
    "courseLevel" TEXT,
    "preferredBatch" TEXT,
    "budget" REAL,
    "revenue" REAL DEFAULT 0,
    "feedbackNeeded" BOOLEAN NOT NULL DEFAULT false,
    "leadType" TEXT,
    "className" TEXT,
    "medium" TEXT,
    "batch" TEXT,
    "campaign" TEXT,
    "doneAt" DATETIME,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "pincode" TEXT,
    "address" TEXT,
    "ownerId" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedAt" DATETIME,
    "assignedBy" TEXT,
    "nextFollowUp" DATETIME,
    "lastContactAt" DATETIME,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" DATETIME,
    "customFields" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leads_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_leads" ("address", "altPhone", "assignedAt", "assignedBy", "budget", "city", "convertedAt", "country", "courseInterested", "courseLevel", "createdAt", "createdById", "customFields", "email", "firstName", "id", "isConverted", "lastContactAt", "lastName", "nextFollowUp", "ownerId", "phone", "pincode", "preferredBatch", "priority", "source", "state", "status", "tags", "updatedAt") SELECT "address", "altPhone", "assignedAt", "assignedBy", "budget", "city", "convertedAt", "country", "courseInterested", "courseLevel", "createdAt", "createdById", "customFields", "email", "firstName", "id", "isConverted", "lastContactAt", "lastName", "nextFollowUp", "ownerId", "phone", "pincode", "preferredBatch", "priority", "source", "state", "status", "tags", "updatedAt" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_ownerId_idx" ON "leads"("ownerId");
CREATE INDEX "leads_phone_idx" ON "leads"("phone");
CREATE INDEX "leads_email_idx" ON "leads"("email");
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "note" TEXT,
    "dueDate" DATETIME,
    "dueAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT,
    "leadId" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("assigneeId", "completedAt", "createdAt", "createdById", "description", "dueDate", "id", "leadId", "priority", "status", "title", "updatedAt") SELECT "assigneeId", "completedAt", "createdAt", "createdById", "description", "dueDate", "id", "leadId", "priority", "status", "title", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
