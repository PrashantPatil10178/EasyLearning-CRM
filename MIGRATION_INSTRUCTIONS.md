# Run Prisma Migration for Lead Status Fields

# Generate and apply the migration

npx prisma migrate dev --name add_lead_status_config

# Generate Prisma Client

npx prisma generate
