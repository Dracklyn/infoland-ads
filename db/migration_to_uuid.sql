-- Migration script to convert existing tables from BIGSERIAL to UUID
-- Run this in your Supabase SQL Editor if you have existing data

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Add new UUID column to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT uuid_generate_v4();

-- Step 3: Populate the new UUID column (if you have existing data)
-- This keeps the relationship with existing data
UPDATE ads SET id_new = uuid_generate_v4() WHERE id_new IS NULL;

-- Step 4: Drop the old primary key constraint
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_pkey;

-- Step 5: Drop the old id column
ALTER TABLE ads DROP COLUMN IF EXISTS id;

-- Step 6: Rename the new column to id
ALTER TABLE ads RENAME COLUMN id_new TO id;

-- Step 7: Add primary key constraint
ALTER TABLE ads ADD PRIMARY KEY (id);

-- Step 8: Repeat for admin_users table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT uuid_generate_v4();
UPDATE admin_users SET id_new = uuid_generate_v4() WHERE id_new IS NULL;
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_pkey;
ALTER TABLE admin_users DROP COLUMN IF EXISTS id;
ALTER TABLE admin_users RENAME COLUMN id_new TO id;
ALTER TABLE admin_users ADD PRIMARY KEY (id);

-- Step 9: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_is_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);

-- Note: If you have foreign key relationships, you'll need to update those as well

