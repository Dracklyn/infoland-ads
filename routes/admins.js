import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken } from './auth.js';
import { getSupabase } from '../db/database.js';

const router = express.Router();

// NOTE: All admin management endpoints are INTERNAL ONLY
// They require authentication and are only used by the admin dashboard
// These are NOT public APIs and should not be exposed externally

// Get all admins (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, username, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching admins:', error);
      throw error;
    }

    // Don't return password hashes
    res.json(admins || []);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create new admin (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate username
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    const supabase = getSupabase();
    
    // Check if username already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        password_hash: passwordHash
      })
      .select('id, username, created_at')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(newAdmin);
  } catch (error) {
    console.error('Error creating admin:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change admin password (admin only)
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const supabase = getSupabase();

    // Get admin with password hash
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    const { data: updatedAdmin, error } = await supabase
      .from('admin_users')
      .update({ password_hash: newPasswordHash })
      .eq('id', id)
      .select('id, username, created_at')
      .single();

    if (error) {
      throw error;
    }

    res.json({ message: 'Password updated successfully', admin: updatedAdmin });
  } catch (error) {
    console.error('Error updating admin password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete admin (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id; // From JWT token

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const supabase = getSupabase();

    // Check if admin exists
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Delete admin
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as adminsRoutes };

