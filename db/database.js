import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
}

// Warn if service role key is not set (admin operations may be limited by RLS)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Using anon key. Admin operations may be limited by Row Level Security (RLS) policies.');
}

// Use service role key for admin operations, or anon key for public operations
export const supabase = createClient(supabaseUrl, supabaseKey);

let isInitialized = false;

export async function initDatabase() {
  if (isInitialized) {
    return;
  }

  try {
    console.log('📦 Connecting to Supabase...');
    
    // Test connection
    const { data, error } = await supabase.from('ads').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is OK
      throw error;
    }

    // Create default admin user if it doesn't exist
    await createDefaultAdmin();
    
    isInitialized = true;
    console.log('✅ Supabase database connected and initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error.message);
    throw error;
  }
}

async function createDefaultAdmin() {
  try {
    // Check if admin user exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // If error is not "not found", log it
      if (checkError.code !== 'PGRST116') {
        console.error('Error checking for admin user:', checkError);
      }
    }

    if (!existingAdmin) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          username: 'admin',
          password_hash: passwordHash
        });

      if (insertError) {
        console.error('Error creating default admin:', insertError);
      } else {
        console.log('👤 Default admin user created: username=admin, password=' + defaultPassword);
      }
    }
  } catch (error) {
    console.error('Error in createDefaultAdmin:', error);
  }
}

export function getSupabase() {
  if (!isInitialized) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return supabase;
}
