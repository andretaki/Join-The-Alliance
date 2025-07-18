# IMPORTANT: Database Migration Required

## Issue
The application form has been updated to remove the following fields:
- Shift preference question
- I-9 documentation question

However, the production database still has NOT NULL constraints on these columns.

## Migration Files
The following migration has been generated and needs to be applied to the production database:

### File: `drizzle/0001_long_invaders.sql`
```sql
ALTER TABLE "employee_applications"."employee_applications" ALTER COLUMN "shift_preference" DROP NOT NULL;
ALTER TABLE "employee_applications"."employee_applications" ALTER COLUMN "has_valid_i9_documents" DROP NOT NULL;
```

## How to Apply the Migration

### Option 1: Using Drizzle Kit (Recommended)
1. Set your `DATABASE_URL` environment variable to point to the production database
2. Run: `npm run db:push`

### Option 2: Manual SQL Execution
1. Connect to your production database
2. Run the SQL commands from the migration file above

### Option 3: Using Vercel/Neon Dashboard
If using Neon (or similar):
1. Go to your database dashboard
2. Open the SQL editor
3. Paste and run the migration SQL

## Temporary Fix (Already Applied)
Until the migration is run, the API has been updated to provide default values:
- `shift_preference`: defaults to 'not-specified'
- `has_valid_i9_documents`: defaults to false

This allows the form to submit successfully even before the migration is applied.

## Verification
After running the migration, you can verify it worked by:
1. Submitting a test application
2. Checking that no database constraint errors occur
3. The shift_preference and has_valid_i9_documents columns should accept NULL values