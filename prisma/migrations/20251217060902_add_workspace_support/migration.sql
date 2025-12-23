-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "workspaceId" TEXT,
    CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "activities_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_activities" ("createdAt", "description", "id", "leadId", "message", "performedAt", "subject", "type", "userId") SELECT "createdAt", "description", "id", "leadId", "message", "performedAt", "subject", "type", "userId" FROM "activities";
DROP TABLE "activities";
ALTER TABLE "new_activities" RENAME TO "activities";
CREATE INDEX "activities_leadId_idx" ON "activities"("leadId");
CREATE INDEX "activities_userId_idx" ON "activities"("userId");
CREATE INDEX "activities_workspaceId_idx" ON "activities"("workspaceId");
CREATE TABLE "new_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "timing" TEXT,
    "days" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "batches_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batches_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_batches" ("courseId", "createdAt", "days", "endDate", "enrolledCount", "id", "maxStudents", "name", "startDate", "status", "timing", "updatedAt") SELECT "courseId", "createdAt", "days", "endDate", "enrolledCount", "id", "maxStudents", "name", "startDate", "status", "timing", "updatedAt" FROM "batches";
DROP TABLE "batches";
ALTER TABLE "new_batches" RENAME TO "batches";
CREATE INDEX "batches_workspaceId_idx" ON "batches"("workspaceId");
CREATE TABLE "new_calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "duration" INTEGER,
    "fromNumber" TEXT,
    "toNumber" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "notes" TEXT,
    "outcome" TEXT,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nextFollowUp" DATETIME,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT,
    CONSTRAINT "calls_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calls_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_calls" ("createdAt", "duration", "endedAt", "fromNumber", "id", "leadId", "nextFollowUp", "notes", "outcome", "recordingUrl", "startedAt", "status", "toNumber", "type", "userId") SELECT "createdAt", "duration", "endedAt", "fromNumber", "id", "leadId", "nextFollowUp", "notes", "outcome", "recordingUrl", "startedAt", "status", "toNumber", "type", "userId" FROM "calls";
DROP TABLE "calls";
ALTER TABLE "new_calls" RENAME TO "calls";
CREATE INDEX "calls_leadId_idx" ON "calls"("leadId");
CREATE INDEX "calls_userId_idx" ON "calls"("userId");
CREATE INDEX "calls_workspaceId_idx" ON "calls"("workspaceId");
CREATE TABLE "new_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetAudience" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" REAL,
    "actualSpend" REAL DEFAULT 0,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "convertedLeads" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "campaigns_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_campaigns" ("actualSpend", "budget", "convertedLeads", "createdAt", "createdById", "description", "endDate", "id", "name", "startDate", "status", "targetAudience", "totalLeads", "type", "updatedAt") SELECT "actualSpend", "budget", "convertedLeads", "createdAt", "createdById", "description", "endDate", "id", "name", "startDate", "status", "targetAudience", "totalLeads", "type", "updatedAt" FROM "campaigns";
DROP TABLE "campaigns";
ALTER TABLE "new_campaigns" RENAME TO "campaigns";
CREATE INDEX "campaigns_workspaceId_idx" ON "campaigns"("workspaceId");
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" REAL NOT NULL,
    "discountPrice" REAL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "durationDays" INTEGER,
    "durationHours" INTEGER,
    "mode" TEXT NOT NULL DEFAULT 'ONLINE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "courses_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("category", "code", "createdAt", "currency", "description", "discountPrice", "durationDays", "durationHours", "id", "isActive", "mode", "name", "price", "updatedAt") SELECT "category", "code", "createdAt", "currency", "description", "discountPrice", "durationDays", "durationHours", "id", "isActive", "mode", "name", "price", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");
CREATE INDEX "courses_workspaceId_idx" ON "courses"("workspaceId");
CREATE TABLE "new_daily_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "workspaceId" TEXT,
    "newLeads" INTEGER NOT NULL DEFAULT 0,
    "contactedLeads" INTEGER NOT NULL DEFAULT 0,
    "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
    "convertedLeads" INTEGER NOT NULL DEFAULT 0,
    "lostLeads" INTEGER NOT NULL DEFAULT 0,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "connectedCalls" INTEGER NOT NULL DEFAULT 0,
    "avgCallDuration" INTEGER NOT NULL DEFAULT 0,
    "newDeals" INTEGER NOT NULL DEFAULT 0,
    "wonDeals" INTEGER NOT NULL DEFAULT 0,
    "lostDeals" INTEGER NOT NULL DEFAULT 0,
    "dealValue" REAL NOT NULL DEFAULT 0,
    "tasksCreated" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_stats_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_daily_stats" ("avgCallDuration", "connectedCalls", "contactedLeads", "convertedLeads", "createdAt", "date", "dealValue", "id", "lostDeals", "lostLeads", "newDeals", "newLeads", "qualifiedLeads", "tasksCompleted", "tasksCreated", "totalCalls", "wonDeals") SELECT "avgCallDuration", "connectedCalls", "contactedLeads", "convertedLeads", "createdAt", "date", "dealValue", "id", "lostDeals", "lostLeads", "newDeals", "newLeads", "qualifiedLeads", "tasksCompleted", "tasksCreated", "totalCalls", "wonDeals" FROM "daily_stats";
DROP TABLE "daily_stats";
ALTER TABLE "new_daily_stats" RENAME TO "daily_stats";
CREATE INDEX "daily_stats_workspaceId_idx" ON "daily_stats"("workspaceId");
CREATE UNIQUE INDEX "daily_stats_date_workspaceId_key" ON "daily_stats"("date", "workspaceId");
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
    "workspaceId" TEXT,
    CONSTRAINT "leads_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leads_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_leads" ("address", "altPhone", "assignedAt", "assignedBy", "batch", "budget", "campaign", "city", "className", "convertedAt", "country", "courseInterested", "courseLevel", "createdAt", "createdById", "customFields", "doneAt", "email", "feedbackNeeded", "firstName", "id", "isConverted", "lastContactAt", "lastName", "leadType", "medium", "nextFollowUp", "ownerId", "phone", "pincode", "preferredBatch", "priority", "revenue", "source", "state", "status", "tags", "updatedAt") SELECT "address", "altPhone", "assignedAt", "assignedBy", "batch", "budget", "campaign", "city", "className", "convertedAt", "country", "courseInterested", "courseLevel", "createdAt", "createdById", "customFields", "doneAt", "email", "feedbackNeeded", "firstName", "id", "isConverted", "lastContactAt", "lastName", "leadType", "medium", "nextFollowUp", "ownerId", "phone", "pincode", "preferredBatch", "priority", "revenue", "source", "state", "status", "tags", "updatedAt" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_ownerId_idx" ON "leads"("ownerId");
CREATE INDEX "leads_phone_idx" ON "leads"("phone");
CREATE INDEX "leads_email_idx" ON "leads"("email");
CREATE INDEX "leads_workspaceId_idx" ON "leads"("workspaceId");
CREATE TABLE "new_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notes" ("content", "createdAt", "id", "leadId", "updatedAt", "userId") SELECT "content", "createdAt", "id", "leadId", "updatedAt", "userId" FROM "notes";
DROP TABLE "notes";
ALTER TABLE "new_notes" RENAME TO "notes";
CREATE INDEX "notes_leadId_idx" ON "notes"("leadId");
CREATE INDEX "notes_workspaceId_idx" ON "notes"("workspaceId");
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMode" TEXT NOT NULL DEFAULT 'ONLINE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "referenceNo" TEXT,
    "paymentDate" DATETIME,
    "gateway" TEXT,
    "gatewayResponse" TEXT,
    "leadId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "payments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "currency", "gateway", "gatewayResponse", "id", "leadId", "notes", "paymentDate", "paymentMode", "referenceNo", "status", "transactionId", "updatedAt") SELECT "amount", "createdAt", "currency", "gateway", "gatewayResponse", "id", "leadId", "notes", "paymentDate", "paymentMode", "referenceNo", "status", "transactionId", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE INDEX "payments_leadId_idx" ON "payments"("leadId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_workspaceId_idx" ON "payments"("workspaceId");
CREATE TABLE "new_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL DEFAULT 'general',
    "workspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "settings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_settings" ("category", "createdAt", "id", "key", "type", "updatedAt", "value") SELECT "category", "createdAt", "id", "key", "type", "updatedAt", "value" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
CREATE INDEX "settings_workspaceId_idx" ON "settings"("workspaceId");
CREATE UNIQUE INDEX "settings_key_workspaceId_key" ON "settings"("key", "workspaceId");
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
    "workspaceId" TEXT,
    CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("assigneeId", "completedAt", "createdAt", "createdById", "description", "dueAt", "dueDate", "id", "leadId", "note", "priority", "status", "title", "updatedAt") SELECT "assigneeId", "completedAt", "createdAt", "createdById", "description", "dueAt", "dueDate", "id", "leadId", "note", "priority", "status", "title", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");
CREATE INDEX "tasks_workspaceId_idx" ON "tasks"("workspaceId");
CREATE TABLE "new_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "managerId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "teams_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_teams" ("createdAt", "description", "id", "managerId", "name", "updatedAt") SELECT "createdAt", "description", "id", "managerId", "name", "updatedAt" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
CREATE INDEX "teams_workspaceId_idx" ON "teams"("workspaceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");
