// lib/supabase-client.js
// JavaScript version for backend use

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Backend doesn't need session persistence
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'medical-records-backend'
    }
  }
});

// =============================================
// AUTH FUNCTIONS FOR BACKEND
// =============================================

/**
 * Sign up new user
 */
async function signUp(data) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          ho_ten: data.ho_ten
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('users_profile')
      .insert({
        id: authData.user.id,
        ho_ten: data.ho_ten,
        so_cccd: data.so_cccd,
        ngay_sinh: data.ngay_sinh,
        gioi_tinh: data.gioi_tinh,
        dien_thoai: data.dien_thoai
      });

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      throw new Error('Could not create user profile');
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
}

/**
 * Sign in user
 */
async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return {
      success: true,
      user: data.user,
      session: data.session
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
}

/**
 * Sign out user
 */
async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get current user
 */
async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Get current session
 */
async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Update password
 */
async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reset password via email
 */
async function resetPassword(email, redirectTo) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || 'http://localhost:3000/reset-password'
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export everything
module.exports = {
  supabase,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  updatePassword,
  resetPassword
};