import { supabase } from './supabase.js';
import { SHEETS } from '../constants/schema.js';
import { canMutateData } from '../constants/navigation.js';
import { cell } from '../utils/formatters.js';

// Prefix ID standar per lini tabel
export const TABLE_ID_PREFIXES = {
  rec_ctcp: 'CTCP',
  rec_ctp: 'CTP',
  rec_screen: 'SCRN',
  rec_flexo: 'FLXO',
  rec_etching: 'ETCH'
};

/**
 * Menghasilkan ID berikutnya secara otomatis berdasarkan prefix lini dan baris yang ada
 */
export function generateNextId(tableKey, rows = []) {
  const prefix = TABLE_ID_PREFIXES[tableKey] || 'JOB';
  const cfg = SHEETS[tableKey] || SHEETS.rec_ctcp;
  const idCol = cfg?.i?.id ?? 0;

  let maxNum = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  (rows || []).forEach((r) => {
    if (!r) return;
    const idVal = String(Array.isArray(r) ? cell(r, idCol, '') : (r.id || '')).trim();
    const match = idVal.match(regex);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

/**
 * Mengonversi baris array matrix ke objek kolom Supabase
 */
export function matrixRowToObject(tableKey, row) {
  const cfg = SHEETS[tableKey];
  if (!cfg || !cfg.headers || !row) return {};
  const obj = {};

  if (!Array.isArray(row) && typeof row === 'object') {
    cfg.headers.forEach((h) => {
      obj[h] = row[h] !== undefined && row[h] !== null ? row[h] : '';
    });
    if (tableKey === 'rec_screen') {
      if (!obj.screen_type && row.tipe) obj.screen_type = row.tipe;
    }
    return obj;
  }

  cfg.headers.forEach((h, i) => {
    obj[h] = row[i] !== undefined && row[i] !== null ? row[i] : '';
  });

  if (tableKey === 'rec_screen') {
    if (!obj.screen_type && cfg.i?.tipe != null && row[cfg.i.tipe]) {
      obj.screen_type = row[cfg.i.tipe];
    }
  }

  return obj;
}

/**
 * Mengonversi objek kembali ke baris array matrix sesuai urutan headers
 */
export function objectToMatrixRow(tableKey, obj) {
  const cfg = SHEETS[tableKey];
  if (!cfg || !cfg.headers || !obj) return [];
  return cfg.headers.map((h) => {
    let val = obj[h];
    if (val === undefined || val === null) {
      if (h === 'screen_type' && obj.tipe !== undefined) val = obj.tipe;
      else val = '';
    }
    return val;
  });
}

/**
 * Sinkronisasi data mutasi ke Google Sheets Webhook (Apps Script)
 */
export async function syncProductionToGoogleSheet(action, tableKey, record) {
  const webhookUrl = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GAS_WEBHOOK_URL || import.meta.env?.VITE_SHEETS_WEBHOOK_URL)) || process?.env?.VITE_GAS_WEBHOOK_URL || '';
  if (!webhookUrl) {
    return { ok: true, skipped: true, message: 'Google Sheets webhook URL tidak diset' };
  }

  try {
    const payload = {
      action: action === 'create' ? 'append_production' : 'update_production',
      table: tableKey,
      sheet_name: SHEETS[tableKey]?.label || tableKey,
      id: record.id,
      job_no: record.job_no || record.nojop || '',
      data: record,
      timestamp: new Date().toISOString()
    };

    // Upayakan pengiriman data via POST
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return { ok: true, res };
  } catch (err) {
    console.warn('[Google Sheets Sync Error]:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Membersihkan dan menyelaraskan tipe data sebelum dikirim ke Supabase
 */
function sanitizeRecordForSupabase(tableKey, rawRecord) {
  const cfg = SHEETS[tableKey];
  const headers = cfg?.headers || Object.keys(rawRecord);
  const clean = {};

  headers.forEach((h) => {
    if (rawRecord[h] !== undefined) {
      let val = rawRecord[h];

      // Sanitasi angka untuk kolom kuantitas
      if (['qty_good', 'qty_defect', 'qty_replace', 'qty_new'].includes(h)) {
        if (val === '' || val === null || val === undefined) {
          val = 0;
        } else {
          val = parseInt(val, 10);
          if (isNaN(val)) val = 0;
        }
      } else if (typeof val === 'string') {
        val = val.trim();
        // Nullify string kosong untuk field opsional
        if (val === '') val = null;
      }

      clean[h] = val;
    }
  });

  // Pastikan kolom screen_type untuk lini rec_screen terisi jika dikirim sebagai tipe
  if (tableKey === 'rec_screen' && (clean.screen_type === undefined || clean.screen_type === null)) {
    if (rawRecord.tipe !== undefined && rawRecord.tipe !== null) {
      clean.screen_type = typeof rawRecord.tipe === 'string' ? rawRecord.tipe.trim() || null : rawRecord.tipe;
    }
  }

  return clean;
}

/**
 * Tambah Job Baru ke Supabase dan Google Sheets (CREATE)
 */
export async function createProductionJob({ tableKey, record, userRole }) {
  // 1. Guard RBAC fungsi
  if (!canMutateData(userRole)) {
    return {
      ok: false,
      error: `Akses ditolak: Role "${String(userRole || 'tamu').toUpperCase()}" tidak memiliki izin menambah data.`
    };
  }

  if (!record || !record.id) {
    return { ok: false, error: 'ID transaksi tidak boleh kosong.' };
  }

  try {
    const cleanRecord = sanitizeRecordForSupabase(tableKey, record);

    // 2. Insert ke Supabase
    const { data, error } = await supabase
      .from(tableKey)
      .insert([cleanRecord])
      .select();

    if (error) {
      console.error(`[Supabase Insert Error ${tableKey}]:`, error);
      return { ok: false, error: error.message || 'Gagal menyimpan data ke Supabase.' };
    }

    const savedRecord = (data && data[0]) ? data[0] : cleanRecord;

    // 3. Dual-sync ke Google Sheets Webhook
    let gasSynced = true;
    try {
      const gasRes = await syncProductionToGoogleSheet('create', tableKey, savedRecord);
      gasSynced = gasRes.ok;
    } catch {
      gasSynced = false;
    }

    return {
      ok: true,
      data: savedRecord,
      gasSynced,
      message: gasSynced
        ? 'Data pekerjaan baru berhasil disimpan ke Supabase & Google Sheets.'
        : 'Data berhasil disimpan ke Supabase (Sinkronisasi Google Sheets offline/pending).'
    };
  } catch (err) {
    console.error('[createProductionJob Exception]:', err);
    return { ok: false, error: err.message || 'Terjadi kesalahan sistem saat menambah data.' };
  }
}

/**
 * Mendeteksi tabel lini produksi terkait berdasarkan ID atau Kategori
 */
export function detectTargetTable(id = '', category = '') {
  const idUp = String(id || '').toUpperCase();
  const catUp = String(category || '').toUpperCase();

  if (idUp.startsWith('CTCP') || catUp === 'CTCP' || catUp === 'OFFSET') return 'rec_ctcp';
  if (idUp.startsWith('CTP') || catUp === 'CTP') return 'rec_ctp';
  if (idUp.startsWith('SCRN') || catUp === 'SCREEN') return 'rec_screen';
  if (idUp.startsWith('FLX') || catUp === 'FLEXO') return 'rec_flexo';
  if (idUp.startsWith('ETCH') || catUp === 'ETCHING') return 'rec_etching';
  return null;
}

/**
 * Perbarui Job yang ada di Supabase dan Google Sheets (UPDATE)
 */
export async function updateProductionJob({ tableKey, record, userRole }) {
  // 1. Guard RBAC fungsi
  if (!canMutateData(userRole)) {
    return {
      ok: false,
      error: `Akses ditolak: Role "${String(userRole || 'tamu').toUpperCase()}" tidak memiliki izin mengubah data.`
    };
  }

  if (!record || !record.id) {
    return { ok: false, error: 'ID transaksi tidak valid untuk diperbarui.' };
  }

  try {
    const cleanRecord = sanitizeRecordForSupabase(tableKey, record);

    // 2. Update di Supabase tabel utama berdasarkan ID
    const { data, error } = await supabase
      .from(tableKey)
      .update(cleanRecord)
      .eq('id', record.id)
      .select();

    if (error) {
      console.error(`[Supabase Update Error ${tableKey}]:`, error);
      return { ok: false, error: error.message || 'Gagal memperbarui data di Supabase.' };
    }

    const updatedRecord = (data && data[0]) ? data[0] : cleanRecord;

    // 3. Jika tableKey adalah job_active, sinkronkan juga ke tabel lini produksi terkait
    const targetTable = detectTargetTable(record.id, record.category);
    let targetUpdated = null;
    if (tableKey === 'job_active' && targetTable) {
      try {
        const cleanTarget = sanitizeRecordForSupabase(targetTable, record);
        const { data: tData } = await supabase
          .from(targetTable)
          .update(cleanTarget)
          .eq('id', record.id)
          .select();
        if (tData && tData[0]) targetUpdated = tData[0];
      } catch (err) {
        console.warn(`[Sync to ${targetTable} note]:`, err.message);
      }
    }

    // 4. Dual-sync ke Google Sheets Webhook
    let gasSynced = true;
    try {
      const gasRes = await syncProductionToGoogleSheet('update', tableKey, updatedRecord);
      gasSynced = gasRes.ok;
      if (targetTable) {
        await syncProductionToGoogleSheet('update', targetTable, targetUpdated || record);
      }
    } catch {
      gasSynced = false;
    }

    return {
      ok: true,
      data: updatedRecord,
      targetTable,
      targetUpdated,
      gasSynced,
      message: gasSynced
        ? 'Perubahan berhasil disimpan ke Supabase & Google Sheets.'
        : 'Perubahan berhasil disimpan ke Supabase (Sinkronisasi Google Sheets offline/pending).'
    };
  } catch (err) {
    console.error('[updateProductionJob Exception]:', err);
    return { ok: false, error: err.message || 'Terjadi kesalahan sistem saat memperbarui data.' };
  }
}

/**
 * Submit Form Permintaan Pekerjaan (Work Request)
 * Terbuka untuk semua role pengguna (termasuk user lapangan/tamu)
 */
export async function submitWorkRequest({ divisionKey, record, currentUser }) {
  if (!divisionKey || !record) {
    return { ok: false, error: 'Data permintaan pekerjaan tidak lengkap.' };
  }

  if (!record.job_name || !record.job_no) {
    return { ok: false, error: 'Nama Pekerjaan dan Nomor Job wajib diisi.' };
  }

  const allowedDivisions = ['rec_screen', 'rec_flexo', 'rec_etching'];
  if (!allowedDivisions.includes(divisionKey)) {
    return { ok: false, error: `Lini pekerjaan "${divisionKey}" tidak mendukung input form langsung.` };
  }

  try {
    // 1. Generate ID jika belum ada
    let finalId = record.id;
    if (!finalId) {
      const { data: existingRows } = await supabase
        .from(divisionKey)
        .select('id')
        .order('id', { ascending: false })
        .limit(100);

      finalId = generateNextId(divisionKey, existingRows || []);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const categoryMap = {
      rec_screen: 'SCREEN',
      rec_flexo: 'FLEXO',
      rec_etching: 'ETCHING'
    };

    const requestedBy = record.requested_by || currentUser?.username || currentUser?.nama_lengkap || 'Staff/User';

    // Format data record sesuai skema tabel lini
    const lineRecord = {
      ...record,
      id: finalId,
      status: 'ANTRI',
      date: record.date || todayStr,
      qty_good: 0,
      qty_defect: 0,
      qty_replace: 0
    };

    // Pastikan operator / notes terisi sesuai struktur tabel
    if (divisionKey === 'rec_screen') {
      if (!lineRecord.operator) lineRecord.operator = requestedBy;
      if (!lineRecord.notes && record.keterangan) lineRecord.notes = record.keterangan;
    } else {
      if (!lineRecord.operator) lineRecord.operator = requestedBy;
      if (!lineRecord.keterangan && record.notes) lineRecord.keterangan = record.notes;
    }

    const cleanLineRecord = sanitizeRecordForSupabase(divisionKey, lineRecord);

    // 2. Simpan ke tabel lini produksi di Supabase
    const { data: savedLineData, error: lineError } = await supabase
      .from(divisionKey)
      .insert([cleanLineRecord])
      .select();

    if (lineError) {
      console.error(`[Work Request Insert Error ${divisionKey}]:`, lineError);
      return { ok: false, error: lineError.message || `Gagal menyimpan permintaan ke tabel ${divisionKey}.` };
    }

    const savedRecord = (savedLineData && savedLineData[0]) ? savedLineData[0] : cleanLineRecord;

    // 3. Masukkan antrean ke job_active agar langsung muncul di Dashboard Overview
    const activeJobRecord = {
      id: finalId,
      job_name: record.job_name,
      job_no: record.job_no,
      file_no: record.file_no || null,
      status: 'ANTRI',
      start_time: null,
      date: record.date || todayStr,
      category: categoryMap[divisionKey] || 'SCREEN'
    };

    try {
      await supabase
        .from('job_active')
        .insert([activeJobRecord]);
    } catch (actErr) {
      console.warn('[Insert job_active note]:', actErr.message);
    }

    // 4. Dual-sync ke Google Sheets Webhook
    let gasSynced = true;
    try {
      const gasPayload = {
        ...savedRecord,
        requested_by: requestedBy
      };
      const gasRes = await syncProductionToGoogleSheet('create', divisionKey, gasPayload);
      gasSynced = gasRes.ok;

      // Sync juga job_active jika webhook mendukung
      try {
        await syncProductionToGoogleSheet('create', 'job_active', activeJobRecord);
      } catch {
        // optional sync
      }
    } catch {
      gasSynced = false;
    }

    return {
      ok: true,
      data: savedRecord,
      activeJob: activeJobRecord,
      gasSynced,
      message: gasSynced
        ? `Permintaan pekerjaan ${finalId} berhasil diajukan dan disinkronkan.`
        : `Permintaan pekerjaan ${finalId} berhasil disimpan ke sistem (Sinkronisasi Sheets offline/pending).`
    };
  } catch (err) {
    console.error('[submitWorkRequest Exception]:', err);
    return { ok: false, error: err.message || 'Terjadi kesalahan sistem saat mengajukan permintaan.' };
  }
}

