-- Update existing lead statuses to new defaults
-- This updates the names and colors of existing statuses

-- Update INITIAL stage statuses
UPDATE "LeadStatusConfig" 
SET name = 'New Lead', color = '#3B82F6'
WHERE stage = 'INITIAL' AND "order" = 0;

-- Clear old ACTIVE statuses if they exist
DELETE FROM "LeadStatusConfig" WHERE stage = 'ACTIVE';

-- Create new ACTIVE statuses
INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Worked',
  'ACTIVE',
  '#8B5CF6',
  false,
  1,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Interested',
  'ACTIVE',
  '#10B981',
  false,
  2,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Just Curious',
  'ACTIVE',
  '#F59E0B',
  false,
  3,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Follow Up',
  'ACTIVE',
  '#06B6D4',
  false,
  4,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

-- Clear old CLOSED statuses
DELETE FROM "LeadStatusConfig" WHERE stage = 'CLOSED';

-- Create new CLOSED statuses
INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'No Response',
  'CLOSED',
  '#6B7280',
  false,
  5,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Not Interested',
  'CLOSED',
  '#EF4444',
  false,
  6,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Won',
  'CLOSED',
  '#22C55E',
  false,
  7,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Lost',
  'CLOSED',
  '#DC2626',
  false,
  8,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;

INSERT INTO "LeadStatusConfig" (id, "workspaceId", name, stage, color, "isDefault", "order", "isDeleted", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "workspaceId",
  'Do Not Contact',
  'CLOSED',
  '#991B1B',
  false,
  9,
  false,
  NOW(),
  NOW()
FROM "LeadStatusConfig" WHERE stage = 'INITIAL' LIMIT 1;
