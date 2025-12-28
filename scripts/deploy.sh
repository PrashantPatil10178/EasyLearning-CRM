#!/bin/bash

# Coolify Pre-deployment Script
# This runs before the application starts in Coolify

echo "🚀 Running pre-deployment tasks..."

# Run database migrations
echo "📦 Running Prisma migrations..."
pnpm prisma migrate deploy

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migrations failed"
    exit 1
fi

# Optional: Seed database (uncomment if needed on first deploy)
# echo "🌱 Seeding database..."
# pnpm prisma db seed

echo "✨ Pre-deployment tasks completed!"
