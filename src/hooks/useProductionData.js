import { useState, useEffect, useCallback } from 'react';
import { fetchAllRows } from '../services/supabase';
import { SHEETS, ALL_KEYS } from '../constants/schema';

function mapRowToMatrix(key, row) {
  if (!row) return [];
  if (Array.isArray(row)) return row;

  const COLUMN_ALIASES = {
    qty_good: ['qty_good', 'good', 'plate_baik', 'jml_baik', 'baik', 'qty_baik', 'total_good', 'hasil_baik', 'qtygood'],
    qty_defect: ['qty_defect', 'defect', 'plate_rusak', 'jml_rusak', 'rusak', 'qty_rusak', 'reject', 'qty_reject', 'total_defect', 'qtydefect'],
    qty_replace: ['qty_replace', 'replace', 'qty_ganti', 'ganti', 'reprint', 'plate_ganti', 'jml_ganti', 'qty_reprint', 'qtyreplace', 'qtyganti'],
    qty_new: ['qty_new', 'qty_total', 'total', 'pakai', 'total_plate', 'qty_diproses', 'qty_baru', 'baru', 'qtynew'],
    date: ['date', 'tanggal', 'tgl', 'tgl_produksi', 'created_at', 'waktu'],
    job_name: ['job_name', 'jop', 'nama_job', 'job', 'nama_jop', 'jop_name', 'item_name', 'jobname'],
    job_no: ['job_no', 'nojop', 'no_job', 'no_jop', 'kode_job', 'kode_jop', 'jop_no', 'jobno'],
    plate_no: ['plate_no', 'no_plate', 'kode_plate', 'plate', 'item_code', 'plateno'],
    operator: ['operator', 'op', 'nama_operator', 'op_name', 'user_name', 'teknisi'],
    po_helper: ['po_helper', 'po', 'helper', 'nama_po', 'po_name', 'asisten', 'pohelper'],
    shift: ['shift', 'regu', 'grup', 'group_shift'],
    expose_mach: ['expose_mach', 'mesin_expose', 'mesin', 'lini_mesin', 'machine', 'unit_mesin', 'exposemach'],
    print_mach: ['print_mach', 'mesin_cetak', 'print_machine', 'cetak_mach', 'printmach'],
    paper_type: ['paper_type', 'jenis_kertas', 'kertas', 'bahan', 'papertype'],
    plate_size: ['plate_size', 'ukuran_plate', 'size_plate', 'ukuran', 'platesize'],
    defect_reason: ['defect_reason', 'penyebab_rusak', 'peny_rusak', 'alasan_rusak', 'kategori_rusak', 'defectreason'],
    replace_reason: ['replace_reason', 'penyebab_ganti', 'peny_ganti', 'alasan_ganti', 'kategori_ganti', 'replacereason'],
    notes: ['notes', 'keterangan', 'ket', 'catatan']
  };

  const findVal = (field) => {
    if (!field) return '';
    if (row[field] !== undefined && row[field] !== null) return row[field];
    
    const lower = field.toLowerCase();
    if (row[lower] !== undefined && row[lower] !== null) return row[lower];
    
    const noUnder = lower.replace(/_/g, '');
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().replace(/_/g, '') === noUnder) {
        return row[k];
      }
    }

    const aliases = COLUMN_ALIASES[field] || COLUMN_ALIASES[lower] || COLUMN_ALIASES[noUnder] || [];
    for (const alias of aliases) {
      if (row[alias] !== undefined && row[alias] !== null) return row[alias];
      const aliasLower = alias.toLowerCase();
      if (row[aliasLower] !== undefined && row[aliasLower] !== null) return row[aliasLower];
      const aliasNoUnder = aliasLower.replace(/_/g, '');
      for (const k of Object.keys(row)) {
        if (k.toLowerCase().replace(/_/g, '') === aliasNoUnder) {
          return row[k];
        }
      }
    }

    return '';
  };

  if (key === 'master_user') {
    return [
      findVal('username') || findVal('user'),
      findVal('role') || 'operator',
      findVal('password_hash') || findVal('password'),
      String(findVal('id') || '1')
    ];
  }

  if (key === 'rec_personil') {
    return {
      id: String(findVal('id') || row.id || ''),
      nick_name: String(findVal('nick_name') || findVal('nickname') || findVal('nama') || findVal('name') || row.nick_name || row.nama || '').trim(),
      nama_lengkap: String(findVal('nama_lengkap') || findVal('full_name') || findVal('nama') || findVal('nick_name') || row.nama_lengkap || row.full_name || '').trim(),
      jabatan: String(findVal('jabatan') || findVal('position') || findVal('role') || row.jabatan || 'Operator Prepress').trim(),
      divisi: String(findVal('divisi') || findVal('division') || row.divisi || 'PREPRESS').trim(),
      lini_mesin: String(findVal('lini_mesin') || findVal('mesin') || findVal('machine') || row.lini_mesin || '-').trim(),
      nik_lama: String(findVal('nik_lama') || row.nik_lama || '-').trim(),
      nik_baru: String(findVal('nik_baru') || row.nik_baru || '-').trim(),
      status_nik: String(findVal('status_nik') || findVal('statusnik') || row.status_nik || '-').trim(),
      role_type: String(findVal('role_type') || findVal('role') || row.role_type || 'OP').trim().toUpperCase(),
      status: row.status !== undefined ? row.status : null,
      raw: row
    };
  }

  if (key === 'rec_absensi') {
    const rawCodeVal = String(
      findVal('status_presensi') ||
      findVal('statuspresensi') ||
      findVal('kode') ||
      findVal('kode_status') ||
      findVal('status_kehadiran') ||
      findVal('status') ||
      findVal('kode_absensi') ||
      row.status_presensi ||
      row.kode ||
      row.kode_status ||
      row.status_kehadiran ||
      row.status ||
      ''
    ).trim().toUpperCase();

    return {
      id: String(findVal('id') || row.id || ''),
      date: findVal('date') || findVal('tanggal') || findVal('tgl') || row.date || row.tanggal || row.tgl || '',
      nick_name: String(findVal('nick_name') || findVal('nickname') || findVal('nama') || row.nick_name || row.nama || '').trim(),
      status_presensi: rawCodeVal,
      kode: rawCodeVal,
      keterangan: String(findVal('keterangan') || findVal('notes') || findVal('alasan') || findVal('ket') || row.keterangan || row.notes || row.alasan || '').trim(),
      jam_masuk: String(findVal('jam_masuk') || findVal('masuk') || row.jam_masuk || '').trim(),
      jam_pulang: String(findVal('jam_pulang') || findVal('pulang') || row.jam_pulang || '').trim(),
      raw: row
    };
  }

  const cfg = SHEETS[key];
  if (cfg && cfg.headers) {
    return cfg.headers.map((h) => findVal(h));
  }

  return Object.values(row);
}

export function useProductionData() {
  const [data, setData] = useState({
    job_active: [],
    rec_ctcp: [],
    rec_ctp: [],
    rec_screen: [],
    rec_flexo: [],
    rec_etching: [],
    master_user: [],
    rec_personil: [],
    rec_absensi: []
  });
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState({});

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const results = {};
    const statuses = {};

    await Promise.all(
      ALL_KEYS.map(async (key) => {
        try {
          const rawRows = await fetchAllRows(key);
          console.log(`[Supabase Raw Data Count]: ${key} = ${rawRows?.length || 0} rows`);
          const matrix = (rawRows || []).map((r) => mapRowToMatrix(key, r));
          results[key] = matrix;
          statuses[key] = 'live';
        } catch (err) {
          console.error(`Gagal load key ${key}:`, err);
          results[key] = [];
          statuses[key] = 'offline';
        }
      })
    );

    setData(results);
    setServerStatus(statuses);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return { data, loading, serverStatus, reload: loadAllData };
}