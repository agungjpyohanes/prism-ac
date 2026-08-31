import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchAllRows(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error(`Gagal memuat ${tableName}:`, error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error(`Exception pada ${tableName}:`, err);
    return [];
  }
}