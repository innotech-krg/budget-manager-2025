// Temporäres Script um SuperAdmin zu erstellen
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSuperAdmin() {
  try {
    console.log('🔧 Updating SuperAdmin user...');
    
    // 1. Get existing user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ List error:', listError);
      return;
    }
    
    const existingUser = users.users.find(u => u.email === 'admin@budgetmanager.com');
    
    if (!existingUser) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('✅ Found user:', existingUser.id);
    
    // 2. Update password
    const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: 'Admin123!' }
    );

    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    console.log('✅ Password updated for user:', authUser.user.id);

    // 3. Create/Update profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: authUser.user.id,
        email: 'admin@budgetmanager.com',
        first_name: 'Super',
        last_name: 'Admin',
        role: 'SUPERADMIN',
        is_active: true
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }

    console.log('✅ SuperAdmin created successfully!');
    console.log('📧 Email: admin@budgetmanager.com');
    console.log('🔑 Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSuperAdmin();
