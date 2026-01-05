-- Step 1: Add a temporary column
ALTER TABLE "leads" ADD COLUMN "status_temp" TEXT;

-- Step 2: Copy and transform enum values to string format
UPDATE "leads" SET "status_temp" = 
  CASE "status"
    WHEN 'NEW_LEAD' THEN 'New Lead'
    WHEN 'INTERESTED' THEN 'Interested'
    WHEN 'JUST_CURIOUS' THEN 'Just Curious'
    WHEN 'FOLLOW_UP' THEN 'Follow Up'
    WHEN 'CONTACTED' THEN 'Contacted'
    WHEN 'QUALIFIED' THEN 'Qualified'
    WHEN 'NEGOTIATION' THEN 'Negotiation'
    WHEN 'NO_RESPONSE' THEN 'No Response'
    WHEN 'NOT_INTERESTED' THEN 'Not Interested'
    WHEN 'CONVERTED' THEN 'Converted'
    WHEN 'LOST' THEN 'Lost'
    WHEN 'DO_NOT_CONTACT' THEN 'Do Not Contact'
    WHEN 'WON' THEN 'Won'
    WHEN 'DONE' THEN 'Done'
    ELSE 'New Lead'
  END;

-- Step 3: Drop the old enum column
ALTER TABLE "leads" DROP COLUMN "status";

-- Step 4: Rename the temporary column to status
ALTER TABLE "leads" RENAME COLUMN "status_temp" TO "status";

-- Step 5: Set NOT NULL constraint and default value
ALTER TABLE "leads" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'New Lead';

-- Step 6: Drop the old LeadStatus enum type
DROP TYPE "LeadStatus";
