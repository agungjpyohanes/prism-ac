import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchAllRows(tableName) {
  try {
    let allData = [];
    let from = 0;
    const step = 1000;
    let keepFetching = true;

    // Ambil data bertahap hingga seluruh baris terunduh
    while (keepFetching) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + step - 1);

      if (error) {
        console.error(`Gagal memuat ${tableName}:`, error.message);
        break;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        if (data.length < step) {
          keepFetching = false;
        } else {
          from += step;
        }
      } else {
        keepFetching = false;
      }
    }

    return allData;
  } catch (err) {
    console.error(`Exception pada ${tableName}:`, err);
    return [];
  }
}