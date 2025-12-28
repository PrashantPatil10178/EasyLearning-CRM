/*
  Warnings:

  - A unique constraint covering the columns `[webhookToken]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "webhookToken" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "category" TEXT NOT NULL DEFAULT 'FRESH',
    "status" TEXT NOT NULL DEFAULT 'NEW_LEAD',
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
INSERT INTO "new_leads" ("address", "altPhone", "assignedAt", "assignedBy", "batch", "budget", "campaign", "city", "className", "convertedAt", "country", "courseInterested", "courseLevel", "createdAt", "createdById", "customFields", "doneAt", "email", "feedbackNeeded", "firstName", "id", "isConverted", "lastContactAt", "lastName", "leadType", "medium", "nextFollowUp", "ownerId", "phone", "pincode", "preferredBatch", "priority", "revenue", "source", "state", "status", "tags", "updatedAt", "workspaceId") SELECT "address", "altPhone", "assignedAt", "assignedBy", "batch", "budget", "campaign", "city", "className", "convertedAt", "country", "courseInterested", "courseLevel", "createdAt", "createdById", "customFields", "doneAt", "email", "feedbackNeeded", "firstName", "id", "isConverted", "lastContactAt", "lastName", "leadType", "medium", "nextFollowUp", "ownerId", "phone", "pincode", "preferredBatch", "priority", "revenue", "source", "state", "status", "tags", "updatedAt", "workspaceId" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_ownerId_idx" ON "leads"("ownerId");
CREATE INDEX "leads_phone_idx" ON "leads"("phone");
CREATE INDEX "leads_email_idx" ON "leads"("email");
CREATE INDEX "leads_workspaceId_idx" ON "leads"("workspaceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_webhookToken_key" ON "workspaces"("webhookToken");
