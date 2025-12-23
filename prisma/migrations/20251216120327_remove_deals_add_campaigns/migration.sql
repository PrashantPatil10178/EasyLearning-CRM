/*
  Warnings:

  - You are about to drop the `deals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `dealId` on the `payments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "deals_ownerId_idx";

-- DropIndex
DROP INDEX "deals_stage_idx";

-- DropIndex
DROP INDEX "deals_leadId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "deals";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "payments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "currency", "gateway", "gatewayResponse", "id", "notes", "paymentDate", "paymentMode", "referenceNo", "status", "transactionId", "updatedAt") SELECT "amount", "createdAt", "currency", "gateway", "gatewayResponse", "id", "notes", "paymentDate", "paymentMode", "referenceNo", "status", "transactionId", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE INDEX "payments_leadId_idx" ON "payments"("leadId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
