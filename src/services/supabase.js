import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchAllRows(tableName) {
  try {
    // Ambil data dengan batas limit besar (hingga 50.000 baris)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(0, 49999);

    if (error) {
      console.error(`Gagal memuat tabel ${tableName}:`, error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error(`Exception pada ${tableName}:`, err);
    return [];
  }
}