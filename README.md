# Infoland Ads Management Terminal

A minimalistic ads management system for Infoland with admin interface and API integration endpoints, powered by Supabase.

## Features

- ✅ **Ad Creation Form**: Create ads with title, description, image, CTA URL, category, and timeframe
- ✅ **Ad Listing Interface**: Clean, minimalistic list view of all ads
- ✅ **Integration Endpoint**: Secure API endpoint for external platforms
- ✅ **Admin Access**: Protected with JWT authentication
- ✅ **Supabase Database**: Cloud-hosted PostgreSQL database

## Prerequisites

- Node.js (v18 or higher)
- A Supabase account and project ([Sign up here](https://supabase.com))
- A Cloudinary account ([Sign up here](https://cloudinary.com))

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned

### 2. Run the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Open the file `db/schema.sql` from this repository
3. Copy and paste the entire SQL content into the SQL Editor
4. Click **Run** to execute the schema

This will create:
- `ads` table for storing advertisements
- `admin_users` table for admin authentication
- Indexes for better query performance
- Row Level Security (RLS) policies

### 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY`)
   - **anon key** (this is your `SUPABASE_ANON_KEY`)

⚠️ **Security Note**: The service role key bypasses Row Level Security. Keep it secure and never expose it in client-side code.

## Cloudinary Setup

### 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signing up, you'll be taken to your dashboard

### 2. Get Your Cloudinary Credentials

1. In your Cloudinary dashboard, you'll see your **Cloud Name**, **API Key**, and **API Secret**
2. Copy these values (you'll need them for the `.env` file)

### 3. Configure Upload Settings (Optional)

- Images are automatically optimized and resized
- Maximum file size: 5MB
- Allowed formats: JPEG, PNG, GIF, WebP
- Images are stored in the `infoland-ads` folder in your Cloudinary account

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server Configuration
PORT=3001
JWT_SECRET=your-secret-key-here-change-in-production

# Admin Configuration
ADMIN_PASSWORD=your-admin-password
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Default Credentials

After running the schema, a default admin user is created:
- **Username**: `admin`
- **Password**: `admin123` (or the value set in `ADMIN_PASSWORD` env variable)

⚠️ **Important**: Change the default password in production!

To change the admin password, you can:
1. Update it directly in Supabase dashboard (admin_users table)
2. Or use the `ADMIN_PASSWORD` environment variable (only works on first run if admin doesn't exist)

## API Endpoints

### Admin Endpoints (Require Authentication)

- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token
- `GET /api/ads` - Get all ads
- `GET /api/ads/:id` - Get single ad
- `POST /api/ads` - Create new ad
- `PUT /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad

### Public Integration Endpoints

- `GET /api/integration/ads` - Get all active ads (for external platforms)
- `GET /api/integration/ads/category/:category` - Get active ads by category

## Usage

1. Access the admin interface at `http://localhost:3001`
2. Login with admin credentials
3. Create, edit, or delete ads
4. Use the integration endpoint to fetch ads from external platforms

## Design

The interface follows Infoland brand guidelines:
- **Colors**: #FFFFFF, #E9F3EB, #DBF6DB, #3E5946
- **Fonts**: Karla (sans-serif), Merriweather (serif)
- **Style**: Minimalistic and clean

## Database

Uses **Supabase** (PostgreSQL) for data storage. The database schema is defined in `db/schema.sql`.

### Row Level Security (RLS)

The database uses Supabase Row Level Security:
- **Public API**: Uses anon key and can only read active ads (respects RLS)
- **Admin Operations**: Uses service role key to bypass RLS for full access

## Image Storage

Uses **Cloudinary** for image uploads and storage:
- Images are automatically optimized and resized
- Stored in the cloud with CDN delivery
- Automatic format conversion and optimization
- Images are deleted from Cloudinary when ads are deleted

## File Structure

```
infoland-ads/
├── server.js          # Main server file
├── db/
│   ├── database.js    # Supabase client initialization
│   └── schema.sql     # Database schema (run in Supabase SQL Editor)
├── routes/
│   ├── auth.js        # Authentication routes
│   ├── ads.js         # Ad management routes
│   └── api.js         # Public API routes
├── utils/
│   └── cloudinary.js  # Cloudinary configuration and utilities
├── public/
│   ├── index.html     # Admin interface
│   ├── styles.css     # Styling
│   └── app.js         # Frontend logic
```

## Troubleshooting

### "Missing Supabase environment variables" error

Make sure your `.env` file contains:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`

### "Missing Cloudinary environment variables" error

Make sure your `.env` file contains:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### "relation does not exist" error

Run the SQL schema from `db/schema.sql` in your Supabase SQL Editor.

### Admin login not working

1. Check that the `admin_users` table exists in Supabase
2. Verify the admin user was created (check in Supabase dashboard)
3. Ensure you're using the correct password

## Production Deployment

1. Set strong values for `JWT_SECRET` and `ADMIN_PASSWORD`
2. Use environment variables for all sensitive configuration
3. Images are already stored in Cloudinary (cloud storage with CDN)
4. Set up proper CORS policies
5. Use HTTPS in production
6. Consider upgrading your Cloudinary plan for production workloads
