# Quick Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in your project details:
   - **Name**: Infoland Ads (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **Create new project**
5. Wait 2-3 minutes for the project to be ready

## Step 2: Set Up Database Schema

1. In your Supabase project dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `db/schema.sql` from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Step 3: Get Supabase API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public** key: Copy this
   - **service_role** key: Copy this (⚠️ Keep this secret!)

## Step 4: Set Up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signing up, you'll be taken to your dashboard
3. In the dashboard, you'll see your credentials:
   - **Cloud Name**: Copy this
   - **API Key**: Copy this
   - **API Secret**: Copy this (⚠️ Keep this secret!)

## Step 5: Configure Environment

1. In the project root, create a `.env` file:
```bash
cp .env.example .env  # If you have an example file
# Or create .env manually
```

2. Add your credentials:
```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=3001
JWT_SECRET=your-random-secret-key-here
ADMIN_PASSWORD=your-secure-admin-password
```

## Step 6: Install and Run

```bash
npm install
npm start
```

## Step 7: Access Admin Interface

1. Open `http://localhost:3001` in your browser
2. Login with:
   - Username: `admin`
   - Password: `admin123` (or your `ADMIN_PASSWORD`)

## Verify Setup

1. ✅ Database connection works (server starts without errors)
2. ✅ Can login to admin interface
3. ✅ Can create a test ad with an image
4. ✅ Image uploads to Cloudinary successfully
5. ✅ Can view ads in the list (images load from Cloudinary)
6. ✅ Public API endpoint works: `http://localhost:3001/api/integration/ads`

## Troubleshooting

**"Missing Supabase environment variables"**
- Check your `.env` file has all required variables
- Make sure there are no extra spaces or quotes

**"relation does not exist"**
- Go back to Step 2 and run the schema.sql again

**Can't login**
- Check Supabase dashboard → Table Editor → `admin_users`
- Verify the admin user exists
- Try resetting password in Supabase or recreate admin user

**Connection errors**
- Verify your Supabase project is active (not paused)
- Check your Project URL is correct
- Ensure your API keys are correct

**Image upload fails**
- Check your Cloudinary credentials in `.env`
- Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set
- Check Cloudinary dashboard to see if images are uploading
- Ensure file size is under 5MB

