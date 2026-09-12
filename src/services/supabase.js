import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Mengambil seluruh baris data dari tabel Supabase dengan pagination otomatis
 */
export async function fetchAllRows(tableName) {
  try {
    let allData = [];
    let from = 0;
    const step = 1000;
    let keepFetching = true;

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

/**
 * Sinkronisasi data user baru ke Google Spreadsheet via Webhook (Google Apps Script)
 */
export async function syncUserToGoogleSheet(action, payload) {
  const webhookUrl = import.meta.env.VITE_GAS_WEBHOOK_URL || import.meta.env.VITE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: action || 'sync_user',
        table: 'master_user',
        ...payload
      })
    });
  } catch (err) {
    console.warn('Sync ke Google Spreadsheet Apps Script:', err.message);
  }
}

/**
 * Menyimpan / memperbarui user di tabel master_user Supabase dan Google Spreadsheet
 * Kolom: id, username, role, password_hash
 */
export async function syncToMasterUser({ id, username, role, password_hash }) {
  const uClean = String(username || '').trim().toLowerCase();
  const rClean = String(role || 'prepress').trim().toLowerCase();
  const pClean = String(password_hash || '').trim();
  const uId = id || `usr_${Date.now()}`;

  const userRecord = {
    id: uId,
    username: uClean,
    role: rClean,
    password_hash: pClean
  };

  try {
    // 1. Simpan ke Supabase tabel master_user
    const { data, error } = await supabase
      .from('master_user')
      .upsert([userRecord], { onConflict: 'username' })
      .select();

    if (error) {
      console.warn('Supabase master_user upsert error:', error.message);
    }

    // 2. Sinkronkan ke Google Spreadsheet
    await syncUserToGoogleSheet('upsert_user', userRecord);

    return { ok: true, data: data || [userRecord] };
  } catch (err) {
    console.error('Exception syncToMasterUser:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Memperbarui password di tabel master_user Supabase & Google Spreadsheet
 */
export async function updateMasterUserPassword(username, newPasswordHash) {
  const uClean = String(username || '').trim().toLowerCase();
  const pClean = String(newPasswordHash || '').trim();

  try {
    const { data, error } = await supabase
      .from('master_user')
      .update({ password_hash: pClean })
      .eq('username', uClean)
      .select();

    if (error) {
      console.warn('Supabase master_user update password error:', error.message);
    }

    await syncUserToGoogleSheet('update_password', {
      username: uClean,
      password_hash: pClean
    });

    return { ok: true, data };
  } catch (err) {
    console.error('Exception updateMasterUserPassword:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Login langsung dengan mencocokkan tabel master_user di Supabase
 */
export async function loginFromMasterUser(username, password) {
  const uClean = String(username || '').trim().toLowerCase();
  const pClean = String(password || '').trim();

  try {
    const { data, error } = await supabase
      .from('master_user')
      .select('id, username, role, password_hash')
      .eq('username', uClean)
      .maybeSingle();

    if (!error && data) {
      if (data.password_hash === pClean) {
        return {
          ok: true,
          user: {
            USER: data.username,
            username: data.username,
            ROLE: data.role || 'prepress',
            role: data.role || 'prepress',
            ID: data.id || '1'
          }
        };
      }
    }
    return { ok: false, error: 'Password tidak cocok' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}