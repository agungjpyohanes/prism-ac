import { createClient } from '@supabase/supabase-js';
import { TABLE_NAMES } from '../constants/schema';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1. Cek Koneksi & Keberadaan Tabel
export const checkTableConnection = async (tableName) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, count: data ? data.length : 0 };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// 2. Fungsi Login menggunakan master_user & password_hash
export const loginUser = async (username, password) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAMES.USERS)
      .select('id, username, role, password_hash')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('User tidak ditemukan');

    // Catatan: Jika password_hash disimpan plain text atau hash tertentu:
    if (data.password_hash !== password) {
      throw new Error('Password salah');
    }

    return { 
      success: true, 
      user: {
        id: data.id,
        username: data.username,
        role: data.role
      } 
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// 3. Fungsi Register ke master_user
export const registerUser = async (username, password, role = 'operator') => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAMES.USERS)
      .insert([
        {
          username: username,
          password_hash: password,
          role: role
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, user: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
};