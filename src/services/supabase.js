import { createClient } from '@supabase/supabase-js';
import { TABLE_NAMES } from '../constants/schema';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Mengambil seluruh baris data dari tabel Supabase
 * @param {string} tableName - Nama tabel (misal: 'rec_ctcp', 'jop_active', 'master_user')
 * @returns {Promise<Array>} Array of rows
 */
export async function fetchAllRows(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error(`Error fetching table ${tableName}:`, error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`Fetch failure on ${tableName}:`, err);
    return [];
  }
}

export { TABLE_NAMES };